import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Environment
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
serve(async (req)=>{
  try {
    const { doctor_id, blog_title, blog_content, excerpt, image, blog_tags, blog_status, published_at } = await req.json();
    // Validate required fields
    if (!doctor_id || !blog_title || !blog_content) {
      return new Response(JSON.stringify({
        error: "Missing required fields."
      }), {
        status: 400
      });
    }

    // Validate blog_tags
    if (!Array.isArray(blog_tags) || !blog_tags.every((tag)=>typeof tag === "string")) {
      return new Response(JSON.stringify({
        error: "blog_tags must be an array of strings."
      }), {
        status: 400
      });
    }
    // Validate published_at if blog_status is "published"
    let finalPublishedAt = null;
    if (blog_status === "published") {
      if (!published_at || isNaN(Date.parse(published_at))) {
        return new Response(JSON.stringify({
          error: "Invalid or missing published_at timestamp."
        }), {
          status: 400
        });
      }
      finalPublishedAt = published_at;
    }
    // Verify doctor exists
    const { data: doctor, error: doctorError } = await supabase.from("staff_members").select("staff_id").eq("staff_id", doctor_id).single();
    if (doctorError || !doctor) {
      return new Response(JSON.stringify({
        error: "Doctor not found."
      }), {
        status: 404
      });
    }
   
    const { error: insertError } = await supabase.from("blog_posts").insert([
      {
        doctor_id,
        blog_title,
        blog_content,
        excerpt,
        image_link: image,
        blog_tags,
        blog_status: blog_status || "draft",
        view_count: 0,
        published_at: finalPublishedAt
      }
    ]);
    if (insertError) {
      return new Response(JSON.stringify({
        error: "Failed to create blog post.",
        details: insertError
      }), {
        status: 500
      });
    }
    return new Response(JSON.stringify({
      message: "Blog post created successfully."
    }), {
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "Server error",
      details: err.message
    }), {
      status: 500
    });
  }
});
