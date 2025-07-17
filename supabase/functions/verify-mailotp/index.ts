import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req)=>{
  try {
    const { email, token, type = "email" } = await req.json();
    // Kiểm tra email và token
    if (!email || !token || typeof email !== "string" || typeof token !== "string") {
      return new Response(JSON.stringify({
        error: "Missing or invalid email/token"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Kiểm tra email là Gmail
    if (!email.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({
        error: "A valid Gmail address is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Kiểm tra type OTP hợp lệ
    if (![
      "email",
      "signup"
    ].includes(type)) {
      return new Response(JSON.stringify({
        error: "Invalid OTP type. Must be 'email' or 'signup'"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    // Xác minh OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: "OTP verified successfully",
      session: data.session,
      user: data.user
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
