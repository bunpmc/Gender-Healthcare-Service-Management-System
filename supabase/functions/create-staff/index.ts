import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.1.0/mod.ts";
// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
// Hàm kiểm tra email bằng RegEx
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
// Hàm tạo mật khẩu ngẫu nhiên
function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for(let i = 0; i < length; i++){
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
// Supabase client
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
// SMTP client
const smtpClient = new SMTPClient({
  connection: {
    hostname: "smtp.gmail.com",
    port: 587,
    tls: false,
    auth: {
      username: Deno.env.get("SMTP_USER") ?? "",
      password: Deno.env.get("SMTP_PASS") ?? ""
    }
  }
});
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 405
      });
    }
    // Kiểm tra biến môi trường
    if (!Deno.env.get("SUPABASE_URL") || !Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      return new Response(JSON.stringify({
        error: "Server config error"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    if (!Deno.env.get("SMTP_USER") || !Deno.env.get("SMTP_PASS")) {
      return new Response(JSON.stringify({
        error: "SMTP configuration missing (user or pass)"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    const formData = await req.formData();
    const full_name = formData.get("full_name")?.toString();
    const working_email = formData.get("working_email")?.toString();
    const role = formData.get("role")?.toString();
    const years_experience = formData.get("years_experience") ? parseInt(formData.get("years_experience")) : null;
    const hired_at = formData.get("hired_at")?.toString();
    const is_available = formData.get("is_available") === "True";
    const staff_status = formData.get("staff_status")?.toString() ?? "active";
    const gender = formData.get("gender")?.toString();
    const languages = formData.get("languages")?.toString().split(",");
    if (!full_name || !working_email || !isValidEmail(working_email)) {
      return new Response(JSON.stringify({
        error: "Missing or invalid required fields: full_name, working_email"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    if (hired_at && !/^\d{4}-\d{2}-\d{2}$/.test(hired_at)) {
      return new Response(JSON.stringify({
        error: "Invalid hired_at format, expected YYYY-MM-DD"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    const image_link = "default.jpg";
    const { data: defaultAvatar } = await supabase.storage.from("staff-uploads").getPublicUrl(image_link);
    if (!defaultAvatar?.publicUrl) {
      return new Response(JSON.stringify({
        error: "Default avatar not found"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    const image_url = defaultAvatar.publicUrl;
    // const password = generateRandomPassword();
    const password = "1234";
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: working_email,
      password,
      email_confirm: true
    });
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: "Failed to create user",
        details: userError?.message
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    const staffId = user.user.id;
    const { error: insertError } = await supabase.from("staff_members").insert([
      {
        staff_id: staffId,
        full_name,
        working_email,
        role,
        years_experience,
        hired_at,
        is_available,
        staff_status,
        gender,
        languages,
        image_link
      }
    ]);
    if (insertError) {
      await supabase.auth.admin.deleteUser(staffId);
      return new Response(JSON.stringify({
        error: "Failed to insert staff profile",
        details: insertError.message
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    try {
      await smtpClient.send({
        from: `Gender Care <${Deno.env.get("SMTP_USER")}>`,
        to: working_email,
        subject: "Your Account Information",
        content: `Hello ${full_name},\n\nYour staff account has been created successfully.\n\nLogin email: ${working_email}\nTemporary password: ${password}\n\nPlease log in and change your password as soon as possible.\n\nThanks,\nGender Care Team`
      });
    } catch (emailError) {
      await supabase.auth.admin.deleteUser(staffId);
      await supabase.from("staff_members").delete().eq("staff_id", staffId);
      return new Response(JSON.stringify({
        error: "Failed to send password email",
        details: emailError.message
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    return new Response(JSON.stringify({
      message: "Staff member created successfully",
      staff_id: staffId,
      image_url,
      temp_password: password
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "Server error",
      details: err.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
