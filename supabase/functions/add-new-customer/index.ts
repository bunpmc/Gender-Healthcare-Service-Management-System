import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";

// Configuration constants
const CONFIG = {
  JWT_ALG: "HS256",
  JWT_EXPIRY: "1h",
  MIN_SECRET_LENGTH: 32,
  HEADERS: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:3000", // Adjust for production
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  },
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

// Error messages
const ERRORS = {
  MISSING_ENV: {
    error:
      "Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or JWT_SECRET",
  },
  METHOD_NOT_ALLOWED: { error: "Method not allowed" },
  INVALID_JSON: { error: "Invalid JSON in request body" },
  MISSING_INPUT: { error: "Email, password, and full_name are required" },
  INVALID_EMAIL: { error: "Invalid email format" },
  AUTH_ERROR: { error: "Failed to create user" },
  DB_ERROR: { error: "Database connection error" },
  RLS_VIOLATION: { error: "Permission denied by RLS policy" },
  SERVER_ERROR: { error: "Internal server error" },
};

// Response helper
const createResponse = (
  body: object,
  status: number,
  headers: Record<string, string> = CONFIG.HEADERS,
): Response => new Response(JSON.stringify(body), { status, headers });

// Initialize Supabase client
const initializeSupabase = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const jwtSecret = Deno.env.get("JWT_SECRET");

  if (!supabaseUrl || !supabaseKey || !jwtSecret) {
    throw new Error(ERRORS.MISSING_ENV.error);
  }
  if (jwtSecret.length < CONFIG.MIN_SECRET_LENGTH) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  return {
    supabase: createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    jwtSecret: new TextEncoder().encode(jwtSecret),
  };
};

// Validate email format
const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Insert customer with retry logic
const insertCustomer = async (
  supabase: any,
  customerId: string,
  email: string,
  fullName: string,
  retries = CONFIG.RETRY_ATTEMPTS,
  delay = CONFIG.RETRY_DELAY_MS,
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase.from("customer").insert({
        customer_id: customerId,
        email,
        full_name: fullName,
        login_type: "email",
        is_email_verified: false,
        is_phone_verified: false,
        status: "active",
        create_at: new Date().toISOString(),
        update_at: new Date().toISOString(),
      });

      if (error) {
        console.error(
          `[${crypto.randomUUID()}] Insert customer error (attempt ${attempt}):`,
          {
            message: error.message,
            code: error.code,
          },
        );
        if (error.code === "42501") {
          return { success: false, error: ERRORS.RLS_VIOLATION, status: 403 };
        }
        if (attempt === retries) {
          return { success: false, error: ERRORS.DB_ERROR, status: 503 };
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return { success: true };
    } catch (err) {
      console.error(
        `[${crypto.randomUUID()}] Retry error (attempt ${attempt}):`,
        {
          message: typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : String(err),
        },
      );
      if (attempt === retries) {
        return { success: false, error: ERRORS.DB_ERROR, status: 503 };
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Insert refresh token
const insertRefreshToken = async (
  supabase: any,
  customerId: string,
  refreshToken: string,
) => {
  const { error } = await supabase.from("refreshtoken").insert({
    customer_id: customerId,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    is_revoked: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error(`[${crypto.randomUUID()}] Insert refresh token error:`, {
      message: error.message,
      code: error.code,
    });
    return { success: false, error: ERRORS.DB_ERROR, status: 503 };
  }
  return { success: true };
};

// Generate JWT
const generateJwt = async (
  customerId: string,
  email: string,
  secret: Uint8Array,
) => {
  return await new jose.SignJWT({
    sub: customerId,
    customer_id: customerId,
    email,
  })
    .setProtectedHeader({ alg: CONFIG.JWT_ALG })
    .setExpirationTime(CONFIG.JWT_EXPIRY)
    .setIssuedAt()
    .sign(secret);
};

// Main server handler
serve(async (req: Request) => {
  const requestId = crypto.randomUUID();

  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return createResponse({}, 204);
    }

    // Validate request method
    if (req.method !== "POST") {
      console.warn(`[${requestId}] Invalid method: ${req.method}`);
      return createResponse(ERRORS.METHOD_NOT_ALLOWED, 405);
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      if (!body.email || !body.password || !body.full_name) {
        console.warn(`[${requestId}] Missing required fields`);
        return createResponse(ERRORS.MISSING_INPUT, 400);
      }
      if (!isValidEmail(body.email)) {
        console.warn(`[${requestId}] Invalid email: ${body.email}`);
        return createResponse(ERRORS.INVALID_EMAIL, 400);
      }
    } catch {
      console.warn(`[${requestId}] Invalid JSON`);
      return createResponse(ERRORS.INVALID_JSON, 400);
    }

    // Initialize Supabase client
    const { supabase, jwtSecret } = initializeSupabase();

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    });

    if (error || !data.user) {
      console.error(
        `[${requestId}] Auth error: ${error?.message || "No user created"}`,
      );
      return createResponse(
        { error: error?.message || ERRORS.AUTH_ERROR.error },
        error?.status || 400,
      );
    }

    const customerId = data.user.id;

    // Insert customer data
    const customerResult = await insertCustomer(
      supabase,
      customerId,
      body.email,
      body.full_name,
    );
    if (!customerResult || !customerResult.success) {
      const errorObj = customerResult?.error || ERRORS.SERVER_ERROR;
      const status = customerResult?.status || 500;
      console.warn(
        `[${requestId}] Customer insertion failed: ${errorObj.error}`,
      );
      return createResponse(errorObj, status);
    }

    // Insert refresh token
    const refreshTokenResult = await insertRefreshToken(
      supabase,
      customerId,
      data.session?.refresh_token || "",
    );
    if (!refreshTokenResult.success) {
      console.warn(
        `[${requestId}] Refresh token insertion failed: ${(refreshTokenResult
          .error?.error ?? "Unknown error")}`,
      );
      return createResponse(
        refreshTokenResult.error ?? ERRORS.SERVER_ERROR,
        refreshTokenResult.status ?? 500,
      );
    }

    // Generate JWT
    const access_token = await generateJwt(customerId, body.email, jwtSecret);
    console.info(
      `[${requestId}] Successfully registered customer ${customerId}`,
    );

    return createResponse(
      {
        access_token,
        refresh_token: data.session?.refresh_token,
        customer_id: customerId,
        email: body.email,
        full_name: body.full_name,
      },
      201,
    );
  } catch (err) {
    console.error(`[${requestId}] Error processing request:`, {
      message: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : "Unknown",
    });

    // If the error is related to JWT generation, handle accordingly
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string" &&
      (err as { message: string }).message.toLowerCase().includes("jwt")
    ) {
      return createResponse({ error: "JWT generation error" }, 400);
    }
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string" &&
      ((err as { message: string }).message.includes("database") ||
        (err as { message: string }).message.includes("PGR"))
    ) {
      return createResponse(ERRORS.DB_ERROR, 503);
    }
    return createResponse(ERRORS.SERVER_ERROR, 500);
  }
});

// curl -X POST http://localhost:54321/functions/v1/customer \
//   -H "Content-Type: application/json" \
//   -d '{"email": "alice.jones@example.com", "password": "securePassword123", "full_name": "Alice Jones"}'
