// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Data } from "https://esm.sh/@types/ws@8.5.13/index.d.mts";

function createErrorResponse(error, status = 400, details = null) {
  const response = {
    error,
  };
  if (details) response.details = details;
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (req.method !== "POST") {
      return createErrorResponse("Method not allowed", 405);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return createErrorResponse("Server configuration error", 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const url = req.url;
    const blogId = url.searchParams.get("blogId");
    const { data, error } = await supabase
      .from("blog_posts")
      .select(`
    blog_id,
    blog_title,
    blog_content,
    image_link,
    excerpt,
    blog_tags,
    blog_status,
    created_at,
    updated_at,
    doctor_details:staff_members!doctor_id(
      full_name,
      image_link
    )
    `)
      .eq("blog_id", blogId)
      .single();
    if (error) {
      return createErrorResponse(error.message, 400, error.details);
    }
    return createSuccessResponse({
      blog_id: data.blog_id,
      blog_title: data.blog_title,
      blog_content: data.blog_content,
      excerpt: data.excerpt,
      image_link: data.image_link,
      blog_tags: data.blog_tags,
      blog_status: data.blog_status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      doctor_details: data.doctor_details,
    });
  } catch {
    return createErrorResponse("Server error", 500);
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-blog-id' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
