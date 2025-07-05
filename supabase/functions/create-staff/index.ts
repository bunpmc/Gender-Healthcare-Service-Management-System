import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req)=>{
  let uploadedFileName11 = null;
  let supabase11 = null;
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed"
      }), {
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
      return new Response(JSON.stringify({
        error: "Server config error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    supabase11 = createClient(supabaseUrl, supabaseServiceRoleKey);
    const formData = await req.formData();
    const full_name = formData.get("full_name")?.toString();
    const working_email = formData.get("working_email")?.toString();
    const role = formData.get("role")?.toString();
    const years_experience = formData.get("years_experience") ? parseInt(formData.get("years_experience")) : null;
    const hired_at = formData.get("hired_at")?.toString();
    const is_available = formData.get("is_available") === "true";
    const staff_status = formData.get("staff_status")?.toString();
    const gender = formData.get("gender")?.toString();
    const languages = formData.get("languages")?.toString().split(",");
    if (!full_name || !working_email) {
      return new Response(JSON.stringify({
        error: "Missing required fields: full_name, working_email"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    let image_link = null;
    let image_url = null;
    const file = formData.get("image");
    if (file && file instanceof File) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif"
      ];
      if (!allowedTypes.includes(file.type)) {
        return new Response(JSON.stringify({
          error: "Invalid file type. Only JPEG, PNG, and GIF are allowed."
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      uploadedFileName11 = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase11.storage.from("staff-uploads").upload(uploadedFileName11, file, {
        contentType: file.type,
        upsert: true
      });
      if (uploadError) {
        return new Response(JSON.stringify({
          error: "Failed to upload image",
          details: uploadError.message
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      const { data: publicData } = supabase11.storage.from("staff-uploads").getPublicUrl(uploadedFileName11);
      if (!publicData?.publicUrl) {
        return new Response(JSON.stringify({
          error: "Failed to retrieve image URL"
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      image_link = uploadedFileName11;
      image_url = publicData.publicUrl;
    }
    const { data: user, error: userError } = await supabase11.auth.admin.createUser({
      email: working_email,
      email_confirm: true
    });
    if (userError || !user) {
      if (uploadedFileName11) {
        await supabase11.storage.from("staff-uploads").remove([
          uploadedFileName11
        ]);
      }
      return new Response(JSON.stringify({
        error: "Failed to create user in Auth",
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
    const { error: insertError } = await supabase11.from("staff_members").insert([
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
      await supabase11.auth.admin.deleteUser(staffId);
      if (uploadedFileName11) {
        await supabase11.storage.from("staff-uploads").remove([
          uploadedFileName11
        ]);
      }
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
      image_url
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    if (uploadedFileName11 && supabase11) {
      await supabase11.storage.from("staff-uploads").remove([
        uploadedFileName11
      ]);
    }
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
