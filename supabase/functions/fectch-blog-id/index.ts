// Setup type definitions for Supabase Edge Runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Utility: Error response with optional detail
function createErrorResponse(error, status = 400, details) {
  const response = {
    error
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
// Utility: Success response with data
function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
// Main handler
serve(async (req)=>{
  try {
    // Handle CORS preflight
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
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!blogId || !uuidRegex.test(blogId)) {
      return createErrorResponse("Invalid or missing blog_id.");
    }
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
    const blog = Array.isArray(data) ? data[0] : data;
    return createSuccessResponse({
      blog_id: blog.blog_id,
      blog_title: blog.blog_title,
      blog_content: blog.blog_content,
      excerpt: blog.excerpt,
      image_link: blog.image_link,
      blog_tags: blog.blog_tags,
      blog_status: blog.blog_status,
      created_at: blog.created_at,
      updated_at: blog.updated_at,
      doctor_details: blog.doctor_details
    });
  } catch (error) {
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
