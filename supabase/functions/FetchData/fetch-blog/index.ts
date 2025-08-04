// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function createErrorResponse(message, statusCode) {
  return new Response(message, {
    status: statusCode,
    headers: {
      "Content-Type": "application/json"
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
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      }
    });
  }
  if (req.method !== "GET") {
    return createErrorResponse("Method not allowed", 405);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createErrorResponse("Server configuration error", 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: blogData, error: blogError } = await supabase.from("blog_posts").select(`
    blog_id,
    blog_title,
    image_link,
    excerpt,
    blog_tags,
    blog_status,
    created_at,
    updated_at,
    doctor_details:staff_members!doctor_id(
      staff_id,
      full_name,
      image_link 
    )`);
  if (!blogData) {
    return createErrorResponse("Failed to fetch blog data", 500);
  }
  const response = await Promise.all(blogData.map(async (blog)=>{
    let imageUrl = null;
    if (blog?.image_link) {
      const { data: publicData } = await supabase.storage.from("blog-uploads").getPublicUrl(blog.image_link);
      imageUrl = publicData.publicUrl;
    }
    return {
      blog_id: blog.blog_id,
      blog_title: blog.blog_title,
      image_link: imageUrl,
      excerpt: blog.excerpt,
      blog_tags: blog.blog_tags,
      blog_status: blog.blog_status,
      created_at: blog.created_at,
      updated_at: blog.updated_at,
      doctor_details: {
        full_name: blog.doctor_details?.full_name || null,
        image_link: imageUrl
      }
    };
  }));
  return createSuccessResponse(response);
}); /* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-blog' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/ 
