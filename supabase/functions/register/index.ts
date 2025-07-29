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
    const { phone } = body;
    if (!phone) {
      return createErrorResponse("Phone number is required", 400);
    }
    if (!/^\+\d{10,15}$/.test(phone)) {
      return createErrorResponse("Invalid phone number format. Use E.164 format (e.g., +1234567890)", 400);
    }
    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers();
    if (userCheckError) {
      return createErrorResponse("Failed to check existing users", 500, userCheckError.message);
    }
    const userExists = existingUser.users.some((user)=>user.phone === phone);
    if (userExists) {
      return createErrorResponse("User with this phone number already exists", 409);
    }
    // Remove any existing OTP for this phone number
    const { error: deleteError } = await supabase.from("otps").delete().eq("phone", phone);
    if (deleteError) {
      console.error("Failed to delete existing OTP:", deleteError);
    // Continue anyway, as this is not critical
    }
    // Generate a new 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10-minute expiration
    // Insert new OTP
    const { error: insertError } = await supabase.from("otps").insert({
      phone,
      otp_code: otpCode,
      expires_at: expiresAt,
      is_used: false
    });
    if (insertError) {
      return createErrorResponse("Failed to store OTP", 500, insertError.message);
    }
    // TODO: Implement SMS sending service here
    // For now, log the OTP for testing purposes
    console.log(`OTP ${otpCode} generated for ${phone} (expires at ${expiresAt})`);
    return createSuccessResponse({
      success: true,
      message: "OTP sent successfully. Please verify the code.",
      data: {
        phone,
        expires_in: 600 // 10 minutes in seconds
      }
    }, 200);
  } catch (error) {
    console.error("General Error:", error);
    return createErrorResponse("Internal server error", 500, error?.message);
  }
});
