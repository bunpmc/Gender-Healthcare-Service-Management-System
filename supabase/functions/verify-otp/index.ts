import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function createErrorResponse(error, status = 400, details = null) {
  const response = {
    error
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
    const { phone, otp_code, password } = body;
    if (!phone || !otp_code || !password) {
      return createErrorResponse("Phone, OTP code, and password are required", 400);
    }
    if (!/^\+\d{10,15}$/.test(phone)) {
      return createErrorResponse("Invalid phone number format. Use E.164 format (e.g., +1234567890)", 400);
    }
    if (password.length < 6) {
      return createErrorResponse("Password must be at least 6 characters long", 400);
    }
    // Verify OTP
    const { data: otpData, error: otpError } = await supabase.from("otps").select("*").eq("phone", phone).eq("otp_code", otp_code).eq("is_used", false).gte("expires_at", new Date().toISOString()).single();
    if (otpError || !otpData) {
      return createErrorResponse("Invalid, expired, or already used OTP", 401);
    }
    // Mark OTP as used
    const { error: updateOtpError } = await supabase.from("otps").update({
      is_used: true
    }).eq("id", otpData.id);
    if (updateOtpError) {
      return createErrorResponse("Failed to update OTP status", 500, updateOtpError.message);
    }
    // Create user with phone and password
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone,
      password,
      email: `${phone.replace('+', '')}@temp.placeholder.com`,
      phone_confirm: true,
      email_confirmed_at: new Date().toISOString(),
      phone_confirmed_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString()
    });
    if (authError || !authData?.user) {
      return createErrorResponse(authError?.message || "User creation failed", 500);
    }
    const user = authData.user;
    // Create patient profile
    const { data: patient, error: patientError } = await supabase.from("patients").insert({
      id: user.id,
      full_name: phone,
      phone: phone,
      email: `${phone.replace('+', '')}@temp.placeholder.com`,
      date_of_birth: null,
      gender: "other",
      patient_status: "active"
    }).select().single();
    if (patientError) {
      await supabase.auth.admin.deleteUser(user.id);
      return createErrorResponse("Failed to create patient profile", 500, patientError.message);
    }
    // Generate custom refresh token
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: tokenError } = await supabase.from("refreshtoken").insert({
      patient_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
      is_revoked: false
    });
    if (tokenError) {
      await supabase.auth.admin.deleteUser(user.id);
      return createErrorResponse("Failed to store refresh token", 500, tokenError.message);
    }
    // Generate session using admin API instead of signInWithPassword
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone.replace('+', '')}@temp.placeholder.com`
    });
    if (sessionError) {
      console.error("Session generation failed:", sessionError);
      // Fallback: try to sign in with password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        phone,
        password
      });
      if (signInError || !signInData?.session) {
        // If both methods fail, create a manual session response
        console.error("Both session methods failed, creating manual response");
        return createSuccessResponse({
          success: true,
          message: "User registered successfully. Please sign in separately.",
          data: {
            patient_id: user.id,
            user: {
              id: user.id,
              phone: user.phone,
              phone_confirmed_at: user.phone_confirmed_at,
              confirmed_at: user.confirmed_at
            },
            patient: {
              patient_id: patient.id,
              full_name: patient.full_name,
              phone: patient.phone,
              gender: patient.gender,
              status: patient.patient_status
            },
            refresh_token: refreshToken,
            note: "Please sign in with phone and password to get access token"
          }
        }, 201);
      }
      const session = signInData.session;
      return createSuccessResponse({
        success: true,
        message: "User registered and logged in successfully",
        data: {
          patient_id: user.id,
          access_token: session.access_token,
          token_type: "Bearer",
          expires_in: session.expires_in,
          refresh_token: refreshToken,
          user: {
            id: user.id,
            phone: user.phone,
            phone_confirmed_at: user.phone_confirmed_at,
            confirmed_at: user.confirmed_at
          },
          patient: {
            patient_id: patient.id,
            full_name: patient.full_name,
            phone: patient.phone,
            gender: patient.gender,
            status: patient.patient_status
          }
        }
      }, 201);
    }
    // Clean up expired OTPs
    await supabase.from("otps").delete().eq("phone", phone).lt("expires_at", new Date().toISOString());
    return createSuccessResponse({
      success: true,
      message: "User registered successfully",
      data: {
        patient_id: user.id,
        user: {
          id: user.id,
          phone: user.phone,
          phone_confirmed_at: user.phone_confirmed_at,
          confirmed_at: user.confirmed_at
        },
        patient: {
          patient_id: patient.id,
          full_name: patient.full_name,
          phone: patient.phone,
          gender: patient.gender,
          status: patient.patient_status
        },
        refresh_token: refreshToken,
        magic_link: sessionData?.properties?.action_link || null,
        note: "User created successfully. Use the magic link or sign in with phone and password."
      }
    }, 201);
  } catch (error) {
    console.error("General Error:", error);
    return createErrorResponse("Internal server error", 500, error?.message);
  }
});
