// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function createErrorResponse(error: string, status = 400, details: any = null) {
  const response: any = {
    error,
  };
  if (details) response.details = details;
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createErrorResponse("Server configuration error", 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  try {
    const body = await req.json();
    const { phone, email, password, access_token } = body;
    if ((!phone && !email) || !password) {
      return createErrorResponse(
        "Phone or email, and password are required",
        400
      );
    }

    if (access_token) {
      const { data: user, error: userError } = await supabase.auth.getUser(
        access_token
      );
      if (userError || !user) {
        return createErrorResponse(
          "User profile not found",
          500,
          userError?.message ?? null
        );
      }
      const { data: customerData, error: customerError } = await supabase
        .from("refreshtoken")
        .select("token")
        .eq("customer_id", user.id)
        .eq("is_revoked", false)
        .gt("expires_at", new Date().toISOString())
        .single();
      if (customerError) {
        return createErrorResponse(
          "Failed to retrieve customer profile",
          500,
          customerError.message
        );
      }
      if (customerData.status !== "active") {
        return createErrorResponse("Account is not active", 403, {
          status: customerData.status,
        });
      }
      return createSuccessResponse(
        {
          success: true,
          message: "Session still valid",
          data: {
            customer_id: user.id,
            access_token,
            token_type: "Bearer",
            expires_in: 3600, // Có thể lấy chính xác từ session nếu cần
            user: {
              id: user.id,
              email: user.email,
              phone: user.phone,
              email_confirmed_at: user.email_confirmed_at,
              phone_confirmed_at: user.phone_confirmed_at,
              last_sign_in_at: user.last_sign_in_at,
            },
            customer: {
              customer_id: customerData.customer_id,
              email: customerData.email,
              phone: customerData.phone,
              full_name: customerData.full_name,
              sex_identify: customerData.sex_identify,
              login_type: customerData.login_type,
              is_email_verified: customerData.is_email_verified,
              is_phone_verified: customerData.is_phone_verified,
              status: customerData.status,
              create_at: customerData.create_at,
              update_at: customerData.update_at,
            },
          },
        },
        200
      );
    }
    let authData, authError;
    if (phone) {
      ({ data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          phone,
          password,
        }));
    } else if (email) {
      ({ data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        }));
    }
    if (authError) {
      return createErrorResponse("Login failed", 401, {
        message: authError.message,
        code: authError.code || "invalid_credentials",
      });
    }
    const user = authData.user;
    const session = authData.session;
    if (!user || !session) {
      return createErrorResponse("Login failed - invalid session", 401);
    }
    const { data: customerData, error: customerError } = await supabase
      .from("customer")
      .select("*")
      .eq("customer_id", user.id)
      .single();
    if (customerError) {
      return createErrorResponse(
        "Failed to retrieve customer profile",
        500,
        customerError.message
      );
    }
    if (customerData.status !== "active") {
      return createErrorResponse("Account is not active", 403, {
        status: customerData.status,
      });
    }
    await supabase
      .from("refreshtoken")
      .update({
        is_revoked: true,
      })
      .eq("customer_id", user.id)
      .eq("is_revoked", false);
    const refreshToken = crypto.randomUUID();
    const { error: tokenError } = await supabase.from("refreshtoken").insert({
      customer_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_revoked: false,
    });
    if (tokenError) {
      console.log("Token Error:", tokenError);
      return createErrorResponse(
        "Failed to store refresh token",
        500,
        tokenError.message
      );
    }
    // Update customer's last login timestamp
    await supabase
      .from("customer")
      .update({
        update_at: new Date().toISOString(),
      })
      .eq("customer_id", user.id);
    return createSuccessResponse(
      {
        success: true,
        message: "Login successful",
        data: {
          customer_id: user.id,
          access_token: session.access_token,
          refresh_token: refreshToken,
          token_type: "Bearer",
          expires_in: session.expires_in || 3600,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            email_confirmed_at: user.email_confirmed_at,
            phone_confirmed_at: user.phone_confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
          },
          customer: {
            customer_id: customerData.customer_id,
            email: customerData.email,
            phone: customerData.phone,
            full_name: customerData.full_name,
            sex_identify: customerData.sex_identify,
            login_type: customerData.login_type,
            is_email_verified: customerData.is_email_verified,
            is_phone_verified: customerData.is_phone_verified,
            status: customerData.status,
            create_at: customerData.create_at,
            update_at: customerData.update_at,
          },
        },
      },
      200
    );
  } catch (error) {
    console.log("General Error:", error);
    return createErrorResponse("Internal server error", 500, error.message);
  }
}); /* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/login' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"phone":"+1234567890","password":"your_password"}'

  Or with email:
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/login' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"email":"user@example.com","password":"your_password"}'

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/login' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
