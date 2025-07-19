import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Init Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);
// Hàm hỗ trợ: Trích xuất file path từ URL nếu cần
function extractFilePathFromUrl(url) {
  const match = url.match(/\/blog-uploads\/(.+)$/);
  return match ? match[1] : null;
}
serve(async (req)=>{
  try {
    // CORS preflight
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
    const body = await req.json();
    const blog_id = body.blog_id;
    if (!blog_id) {
      return new Response(JSON.stringify({
        error: "Missing blog_id"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    // Lấy blog để biết ảnh liên quan
    const { data: blog, error: fetchError } = await supabase.from("blog_posts").select("image_link").eq("blog_id", blog_id).single();
    if (fetchError || !blog) {
      return new Response(JSON.stringify({
        error: "Blog post not found"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    const image_link = blog.image_link;
    let filePath = image_link;
    if (image_link && image_link.startsWith("http")) {
      filePath = extractFilePathFromUrl(image_link);
    }
    // Xoá blog post trong bảng
    const { error: deleteError } = await supabase.from("blog_posts").delete().eq("blog_id", blog_id);
    if (deleteError) {
      return new Response(JSON.stringify({
        error: "Failed to delete blog post",
        details: deleteError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    // Nếu ảnh không phải mặc định thì xoá khỏi bucket
    if (filePath && filePath !== "blog_bg.webp") {
      const { error: removeError } = await supabase.storage.from("blog-uploads").remove([
        filePath
      ]);
      if (removeError) {
        console.warn("[WARN] Image remove failed:", removeError.message);
      } else {
        console.log("[INFO] Removed image:", filePath);
      }
    }
    return new Response(JSON.stringify({
      message: "Blog post deleted successfully."
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
