// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

//Confguration constants
const CONFIG = {
  JWT_ALG: "HS256",
  JWT_EXPIRY: "1h",
  MIN_SECRET_LENGTH: 32,
  HTTP: {
    HEADERS: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:3000", // Adjust for production
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  },
  DATABASE: {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
    REFRESH_TOKEN_EXPIRY_DAYS: 7,
  },
};

const ERRORS = {
  MISSING_ENV: {
    error:
      "Missing environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or JWT_SECRET",
  },
  INVALID_METHOD: { error: "Only POST requests are allowed" },
  INVALID_JSON: { error: "Invalid JSON in request body" },
  MISSING_FIELDS: { error: "Email, password, and full name are required" },
  AUTH_FAILED: { error: "Failed to create user" },
  DATABASE_FAILED: { error: "Database operation failed" },
  RLS_DENIED: { error: "Permission denied by RLS policy" },
  SERVER_ERROR: { error: "Internal server error" },
};

const createResponse = (
  body: object,
  status: number,
  headers = CONFIG.HTTP.HEADERS,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers,
  });

const initializeSupabase = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const jwtSecret = Deno.env.get("JWT_SECRET");

  if (!supabaseUrl || !supabaseKey || !jwtSecret) {
    throw new Error(ERRORS.MISSING_ENV.error);
  }
  if (jwtSecret.length < CONFIG.MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${CONFIG.MIN_SECRET_LENGTH} characters long`,
    );
  }

  return {
    supabase: createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    jwtSecret: new TextEncoder().encode(jwtSecret),
  };
};

const addCustomerToDatabase = async (
  supabase: ReturnType<typeof createClient>,
  email: string,
  fullName: string,
): Promise<{ success: boolean; error?: object; status?: number }> => {
  for (let attempt = 0; attempt < CONFIG.DATABASE.RETRY_ATTEMPTS; attempt++) {
    try {
      const { data, error, status } = await supabase
        .from("customers")
        .insert([{ email, full_name: fullName }])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return { success: true }; // Duplicate entry, no error
        }
        return { success: false, error, status };
      }

      return { success: true };
    }
  }
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-customer' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
