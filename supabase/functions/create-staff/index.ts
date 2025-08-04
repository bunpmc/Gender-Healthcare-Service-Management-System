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
    const password = "1234"
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
        subject: "Welcome to Gender Care - Your Account Details",
        content: `Hello ${full_name},
        \n\nWe are thrilled to welcome you to the Gender Care team! Your staff account has been successfully created, and you can now access our system to begin your journey with us.
        \n\nBelow are your account details:
        \n\nEmail: ${working_email}
        \nTemporary Password: ${password}
        \n\nFor security, please log in and change your password as soon as possible. Do not share your credentials with anyone.
        \n\nIf you have any questions or need assistance, feel free to contact our support team at support@gendercare.com.
        \n\nThanks,
        \nGender Care Team`,
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:Arial,sans-serif;background-color:#f4f4f4;margin:0;padding:0}
        .container{max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
        .header{background-color:#007bff;color:#ffffff;padding:20px;text-align:center;border-top-left-radius:8px;border-top-right-radius:8px}
        .content{padding:20px}.content h2{color:#333333;margin-top:0}
        .content p{color:#555555;line-height:1.6}
        .credentials{background-color:#f9f9f9;padding:15px;border-radius:5px;margin:20px 0}
        .credentials p{margin:5px 0;font-size:16px}
        .credentials strong{color:#007bff}
        .password-text{font-family:monospace;color:#007bff;font-size:16px}
        .footer{text-align:center;padding:10px;color:#999999;font-size:12px}
        </style>
        </head>
        <body>
        <div class="container"><div class="header"><h1>Welcome to Gender Care</h1></div><div class="content"><h2>Hello ${full_name},</h2><p>We are thrilled to welcome you to the Gender Care team! Your staff account has been successfully created, and you can now access our system to begin your journey with us.</p><p>Below are your account details:</p><div class="credentials"><p><strong>Email:</strong> ${working_email}</p><p><strong>Temporary Password:</strong> <span class="password-text">${password}</span></p></div><p>For security, please log in and change your password as soon as possible. Do not share your credentials with anyone.</p><p>If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:support@gendercare.com">support@gendercare.com</a>.</p></div><div class="footer"><p>&copy; ${new Date().getFullYear()} Gender Care. All rights reserved.</p><p>Contact us at <a href="mailto:support@gendercare.com">support@gendercare.com</a></p></div></div></body></html>`
      });
    } catch (emailError) {
      await supabase.auth.admin.deleteUser(staffId);
      await supabase.from("staff_members").delete().eq("staff_id", staffId);
      return new Response(JSON.stringify({
        error: "Failed to send welcome email",
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
