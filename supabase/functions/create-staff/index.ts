import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// function generatePassword(length = 6) {
//   const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let password = "";
//   for (let i = 0; i < length; i++) {
//     password += charset[Math.floor(Math.random() * charset.length)];
//   }
//   return password;
// }

serve(async (req) => {
  let supabase = null;

  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
        }
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: "Server config error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const formData = await req.formData();
    const full_name = formData.get("full_name")?.toString();
    const working_email = formData.get("working_email")?.toString();
    const role = formData.get("role")?.toString();
    const years_experience = formData.get("years_experience") ? parseInt(formData.get("years_experience")) : null;
    const hired_at = formData.get("hired_at")?.toString();
    const is_available = formData.get("is_available") === "True";
    const staff_status = formData.get("staff_status")?.toString();
    const gender = formData.get("gender")?.toString();
    const languages = formData.get("languages")?.toString().split(",");

    if (!full_name || !working_email) {
      return new Response(JSON.stringify({ error: "Missing required fields: full_name, working_email" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const image_link = "default.jpg";
    const { data: defaultAvatar } = supabase.storage.from("staff-uploads").getPublicUrl(image_link);
    const image_url = defaultAvatar?.publicUrl;

    // ✅ Sinh mật khẩu
    // const password = generatePassword(6);
       const password = "1234";
    // ✅ Tạo tài khoản auth với mật khẩu
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
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
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
        staff_status: staff_status ?? "active",
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
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response(JSON.stringify({
      message: "Staff member created successfully",
      staff_id: staffId,
      image_url,
      temp_password: password  // ✅ Trả về mật khẩu đã tạo
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Server error",
      details: err.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
