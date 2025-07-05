import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
function extractInitials(name) {
  return name.split(" ").map((word)=>word.charAt(0).toUpperCase()).join("").slice(0, 3);
}
function generateAvatarUrl(initials) {
  const base = "https://ui-avatars.com/api/";
  const encoded = encodeURIComponent(initials);
  return `${base}?name=${encoded}&background=random&size=256`;
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
    return createResponse({
      error: "Method not allowed"
    }, 405);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    const body = await req.json();
    const { id, full_name, phone, email, date_of_birth, gender, allergies, chronic_conditions, past_surgeries, vaccination_status, image_link, bio } = body;
    if (!id || !full_name) {
      return createResponse({
        error: "Missing required fields"
      }, 400);
    }
    let finalImageLink = image_link;
    // Nếu không có image_link → tạo avatar
    if (!finalImageLink) {
      const initials = extractInitials(full_name);
      const avatarUrl = generateAvatarUrl(initials);
      // Fetch avatar và upload lên bucket
      const avatarResponse = await fetch(avatarUrl);
      const avatarBlob = await avatarResponse.blob();
      const buffer = new Uint8Array(await avatarBlob.arrayBuffer());
      const filePath = `${id}.png`;
      const { error: uploadError } = await supabase.storage.from("patient-uploads") // bạn cần tạo sẵn bucket này
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: true
      });
      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        return createResponse({
          error: "Failed to upload avatar."
        }, 500);
      }
      const { data: publicData } = supabase.storage.from("patient-uploads").getPublicUrl(filePath);
      finalImageLink = publicData?.publicUrl || null;
    }
    // Cập nhật patient profile
    const { error: updateError } = await supabase.from("patients").update({
      full_name,
      phone,
      email,
      date_of_birth,
      gender,
      allergies,
      chronic_conditions,
      past_surgeries,
      vaccination_status,
      image_link: finalImageLink,
      bio
    }).eq("id", id);
    if (updateError) {
      return createResponse({
        error: "Failed to update profile",
        details: updateError.message
      }, 500);
    }
    return createResponse({
      success: true,
      message: "Profile updated successfully.",
      data: {
        id,
        full_name,
        image_link: finalImageLink
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return createResponse({
      error: "Internal server error",
      details: error.message
    }, 500);
  }
});
