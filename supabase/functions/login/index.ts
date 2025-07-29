import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function createErrorResponse(error, status = 400, details = null) {
  const response = {
    error,
    details
  };
  if (details) response.details = details;
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
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
      persistSession: false
    }
  });
  try {
    const body = await req.json();
    const { phone, password } = body;
    if (!phone || !password) {
      return createErrorResponse("Phone or email, and password are required", 400);
    }
    let authData, authError;
    if (phone) {
      ({ data: authData, error: authError } = await supabase.auth.signInWithPassword({
        phone,
        password
      }));
    }
    if (authError) {
      return createErrorResponse("Login failed", 401, {
        message: authError.message,
        code: authError.code || "invalid_credentials"
      });
    }
    const user = authData.user;
    const session = authData.session;
    if (!user || !session) {
      return createErrorResponse("Login failed - invalid session", 401);
    }
    const { data: patientData, error: patientError } = await supabase.from("patients").select("*").eq("id", user.id).single();
    if (patientError) {
      return createErrorResponse("Failed to retrieve patient profile", 500, patientError.message);
    }
    if (patientData.patient_status !== "active") {
      return createErrorResponse("Account is not active", 403);
    }
    // // Revoke existing refresh tokens
    // await supabase.from("refreshtoken").update({
    //   is_revoked: true
    // }).eq("patient_id", user.id).eq("is_revoked", false);
    // const refreshToken = crypto.randomUUID();
    // const { error: tokenError } = await supabase.from("refreshtoken").insert({
    //   patient_id: user.id,
    //   token: refreshToken,
    //   expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    //   is_revoked: false
    // });
    // if (tokenError) {
    //   return createErrorResponse("Failed to store refresh token", 500, tokenError.message);
    // }
    return createSuccessResponse({
      success: true,
      message: "Login successful",
      data: {
        patient_id: user.id,
        access_token: session.access_token,
        token_type: "Bearer",
        expires_in: session.expires_in || 3600,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          email_confirmed_at: user.email_confirmed_at,
          phone_confirmed_at: user.phone_confirmed_at,
          last_sign_in_at: user.last_sign_in_at
        },
        patient: {
          patient_id: patientData.patient_id,
          email: patientData.email,
          phone: patientData.phone,
          full_name: patientData.full_name,
          sex_identify: patientData.sex_identify,
          login_type: patientData.login_type,
          is_email_verified: patientData.is_email_verified,
          is_phone_verified: patientData.is_phone_verified,
          status: patientData.status,
          create_at: patientData.create_at,
          update_at: patientData.update_at
        }
      }
    }, 200);
  } catch (error) {
    return createErrorResponse(error.message, 500, error.message);
  }
});
