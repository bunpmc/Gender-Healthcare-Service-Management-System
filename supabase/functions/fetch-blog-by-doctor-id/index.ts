import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function createResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
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
    return createResponse({
      error: "Method not allowed"
    }, 405);
  }
  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctor_id");
  if (!doctorId) {
    return createResponse({
      error: "Missing doctor_id parameter"
    }, 400);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return createResponse({
      error: "Supabase config missing"
    }, 500);
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    const { data: blogs, error: blogError } = await supabase.from("blog_posts").select("*").eq("doctor_id", doctorId).order("published_at", {
      ascending: false
    });
    if (blogError) {
      return createResponse({
        error: blogError.message
      }, 500);
    }
    if (!blogs || blogs.length === 0) {
      return createResponse({
        blogs: []
      });
    }
    const blogList = blogs.map((blog)=>{
      if (blog.image_link) {
        const cleanPath = blog.image_link.startsWith("blog-uploads/") ? blog.image_link.replace("blog-uploads/", "") : blog.image_link;
        const publicImg = supabase.storage.from("blog-uploads").getPublicUrl(cleanPath);
        blog.image_link = publicImg?.data?.publicUrl || null;
      }
      return blog;
    });
    return createResponse({
      blogs: blogList
    });
  } catch (error) {
    return createResponse({
      error: error.message ?? "Unknown error"
    }, 500);
  }
});
