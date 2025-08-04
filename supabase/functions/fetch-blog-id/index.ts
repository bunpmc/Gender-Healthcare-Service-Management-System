// Setup type definitions for Supabase Edge Runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Utility: Error response with optional detail
function createErrorResponse(error, status = 400, details) {
  const response = {
    error,
    details
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
serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (req.method !== "GET") {
      return createErrorResponse("Method not allowed", 405);
    }
    // Load env vars
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return createErrorResponse("Server configuration error", 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    // Get query param
    const url = new URL(req.url);
    const blogId = url.searchParams.get("blog_id");
    console.log("Received blog_id:", blogId);
    // Call RPC to increment and fetch blog atomically
    const { data, error } = await supabase.rpc("increment_view_and_fetch_blog", {
      input_blog_id: blogId
    });
    if (error) {
      return createErrorResponse("Database error", 500, error.message);
    }
    if (!data || Array.isArray(data) && data.length === 0) {
      return createErrorResponse("Blog not found", 404);
    }
    const blog = Array.isArray(data) ? data[0] : data; //handle both jsonb and table return from rpc
    let imageUrl = null;
    if (blog.image_link) {
      const { data: publicData, error: storageError } = await supabase.storage.from("blog-uploads").getPublicUrl(blog.image_link);
      if (storageError) {
        console.error("Storage error:", storageError.message);
      } else {
        imageUrl = publicData.publicUrl;
      }
    }

    //Doctor image
    const doctorImageLink = blog.doctor_details.image_link;
    let doctorImageUrl = null;
    if (doctorImageLink) {
      const { data: doctorData, error: doctorError } = await supabase.storage.from("staff-uploads").getPublicUrl(doctorImageLink);
      if (doctorError) {
        console.error("Storage error:", doctorError.message);
      } else {
        doctorImageUrl = doctorData.publicUrl;
      }
    }

    return createSuccessResponse({
      blog_id: blog.blog_id,
      blog_title: blog.blog_title,
      blog_content: blog.blog_content,
      excerpt: blog.excerpt,
      image_link: imageUrl,
      blog_tags: blog.blog_tags,
      blog_status: blog.blog_status,
      created_at: blog.created_at,
      updated_at: blog.updated_at,
      doctor_details: {
        staff_id: blog.doctor_details.staff_id,
        full_name: blog.doctor_details.full_name,
        image_link: doctorImageUrl
      }
    });
  } catch (error) {
    return createErrorResponse(error.message, 500, error.message);
  }
});

// curl -X GET "http://127.0.0.1:54321/functions/v1/fetch-blog-id?blog_id=0ab98a9a-3e59-48b8-9cac-371e7d072022" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" -H "Content-Type: application/json"
