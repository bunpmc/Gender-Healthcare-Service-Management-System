import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Init Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);
serve(async (req)=>{
  try {
    // Handle CORS preflight
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
    const formData = await req.formData();
    const doctor_id = formData.get("doctor_id")?.toString();
    const blog_title = formData.get("blog_title")?.toString();
    const blog_content = formData.get("blog_content")?.toString();
    const excerpt = formData.get("excerpt")?.toString();
    const blog_tags = formData.get("blog_tags")?.toString();
    const blog_status = formData.get("blog_status")?.toString() || "draft";
    // Validate required fields
    if (!doctor_id || !blog_title || !blog_content) {
      return new Response(JSON.stringify({
        error: "Missing required fields."
      }), {
        status: 400
      });
    }
    // Validate blog_tags
    const tagsArray = blog_tags ? blog_tags.split(",").map((tag)=>tag.trim()) : [];
    // Auto-generate published_at if status is published
    let published_at = null;
    if (blog_status === "published") {
      published_at = new Date().toISOString();
    }
    // Check doctor exists
    const { data: doctor, error: doctorError } = await supabase.from("staff_members").select("staff_id").eq("staff_id", doctor_id).single();
    if (doctorError || !doctor) {
      return new Response(JSON.stringify({
        error: "Doctor not found."
      }), {
        status: 404
      });
    }
    // Handle image (optional)
    let image_link = null;
    const imageFile = formData.get("image");
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];
      if (!allowedTypes.includes(imageFile.type)) {
        return new Response(JSON.stringify({
          error: "Invalid image type."
        }), {
          status: 400
        });
      }
      const ext = imageFile.name.split(".").pop();
      const filename = `blog_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("blog-uploads").upload(filename, imageFile, {
        contentType: imageFile.type,
        upsert: true
      });
      if (uploadError) {
        return new Response(JSON.stringify({
          error: "Image upload failed",
          details: uploadError.message
        }), {
          status: 500
        });
      }
      const { data: publicData } = supabase.storage.from("blog-uploads").getPublicUrl(filename);
      image_link = publicData?.publicUrl ?? null;
    } else {
      // Use default fallback image
      const { data: defaultImage } = supabase.storage.from("blog-uploads").getPublicUrl("blog_bg.webp");
      image_link = defaultImage?.publicUrl ?? null;
    }
    // Insert blog post
    const { error: insertError } = await supabase.from("blog_posts").insert([
      {
        doctor_id,
        blog_title,
        blog_content,
        excerpt,
        image_link,
        blog_tags: tagsArray,
        blog_status,
        view_count: 0,
        published_at
      }
    ]);
    if (insertError) {
      return new Response(JSON.stringify({
        error: "Failed to create blog post",
        details: insertError.message
      }), {
        status: 500
      });
    }
    return new Response(JSON.stringify({
      message: "Blog post created successfully."
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
