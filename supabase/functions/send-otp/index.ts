// supabase/functions/send-otp/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req)=>{
  try {
    const { email, action } = await req.json();
    // Kiểm tra email hợp lệ và là Gmail
    if (!email || typeof email !== "string" || !email.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({
        error: "A valid Gmail address is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Kiểm tra hành động
    if (![
      "sign-up",
      "sign-in"
    ].includes(action)) {
      return new Response(JSON.stringify({
        error: "Invalid action. Must be 'sign-up' or 'sign-in'"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // Kiểm tra email đã tồn tại
    const { data: users, error: listUsersError } = await supabase.auth.admin.listUsers();
    if (listUsersError) {
      console.error("Error fetching users:", listUsersError);
      return new Response(JSON.stringify({
        error: "Failed to check email existence"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const existingUser = users.users.find((user)=>user.email === email);
    if (action === "sign-up" && existingUser) {
      return new Response(JSON.stringify({
        error: "Email already registered"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (action === "sign-in" && !existingUser) {
      return new Response(JSON.stringify({
        error: "Email is not registered"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Gửi OTP qua Supabase Auth
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: action === "sign-up",
        emailRedirectTo: undefined
      }
    });
    if (otpError) {
      console.error("Error sending OTP:", otpError);
      return new Response(JSON.stringify({
        error: otpError.message
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const message = action === "sign-up" ? "OTP sent to your Gmail for sign-up (expires in 15 minutes)" : "OTP sent to your Gmail for sign-in (expires in 15 minutes)";
    return new Response(JSON.stringify({
      success: true,
      message
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Unexpected error:", err);
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
