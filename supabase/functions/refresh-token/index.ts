import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

const env = await load();
const supabaseUrl = env["SUPABASE_URL"] || Deno.env.get("SUPABASE_URL");
const supabaseKey = env["SUPABASE_ANON_KEY"] ||
  Deno.env.get("SUPABASE_ANON_KEY");
const jwtSecret = env["JWT_SECRET"] || Deno.env.get("JWT_SECRET");

if (!supabaseUrl || !supabaseKey || !jwtSecret) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const JWT_SECRET = jwtSecret;

const createResponse = (body: object, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return createResponse({ error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await req.json();
      if (!body.refresh_token) {
        return createResponse({ error: "Refresh token is required" }, 400);
      }
    } catch {
      return createResponse({ error: "Invalid JSON in request body" }, 400);
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: body.refresh_token,
    });
    if (error || !data.session) {
      return createResponse({ error: "Invalid refresh token" }, 401);
    }

    const customerId = data.session.user.id;
    const { data: userData } = await supabase
      .from("users")
      .select("username")
      .eq("id", customerId)
      .single();

    if (!userData) return createResponse({ error: "User not found" }, 404);

    const payload = { customer_id: customerId, username: userData.username };
    const secret = new TextEncoder().encode(JWT_SECRET);
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(secret);

    return createResponse(
      {
        access_token: jwt,
        refresh_token: data.session.refresh_token, // Token rotation
        username: userData.username,
      },
      200,
    );
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error:", err.message);
    } else {
      console.error("Error:", err);
    }
    return createResponse({ error: "Internal server error" }, 500);
  }
});

// curl -X POST http://localhost:54321/functions/v1/refresh-token \
//   -header "Content-Type: application/json" \
//   -data '{"refresh_token": "your_refresh_token_here"}'
