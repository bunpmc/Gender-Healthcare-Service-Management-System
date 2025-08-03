import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Helper functions for consistent responses
function createErrorResponse(error, status = 400, details = null) {
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
function createSuccessResponse(message) {
  return new Response(JSON.stringify({
    message
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
serve(async (req)=>{
  // Initialize Supabase inside the serve function
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return createErrorResponse("Supabase config missing", 500);
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
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
  // Restrict to POST method
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }
  try {
    // Comment out Authorization header and JWT validation
    /*
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return createErrorResponse("No authorization header provided', 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return createErrorResponse("Unauthorized", 401, authError?.message);
    */ // Parse form data
    const formData = await req.formData();
    const blog_id = formData.get("blog_id")?.toString();
    const blog_title = formData.get("blog_title")?.toString();
    const blog_content = formData.get("blog_content")?.toString();
    const excerpt = formData.get("excerpt")?.toString();
    const blog_tags = formData.get("blog_tags")?.toString();
    const blog_status = formData.get("blog_status")?.toString() || "draft";
    // Validate required fields
    if (!blog_id || !blog_title || !blog_content) {
      return createErrorResponse("Missing required fields: blog_id, blog_title, blog_content", 400);
    }
    // Check if blog exists
    const { data: existingBlog, error: fetchError } = await supabase.from("blog_posts").select("image_link").eq("blog_id", blog_id).single();
    if (fetchError || !existingBlog) {
      return createErrorResponse("Blog not found", 404, fetchError?.message);
    }
    // Handle image (optional)
    let image_link = existingBlog.image_link;
    const imageFile = formData.get("image");
    console.log("Existing Image Link:", image_link); // Debug: Log existing image link
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];
      if (!allowedTypes.includes(imageFile.type)) {
        return createErrorResponse("Invalid image type. Only JPEG, PNG, WEBP allowed.", 400);
      }
      // Delete old image if it exists and isn't the default
      if (image_link && !image_link.includes("blog_bg.webp")) {
        // Assume image_link is either a filename or a full URL
        let oldPath = image_link;
        if (image_link.includes("/blog-uploads/")) {
          // Extract filename from full URL
          const parts = image_link.split("/blog-uploads/");
          oldPath = parts[1] ? parts[1] : image_link;
        } else if (image_link.startsWith("blog-uploads/")) {
          // Remove bucket prefix if present
          oldPath = image_link.replace("blog-uploads/", "");
        }
        // Ensure oldPath is just the filename
        oldPath = oldPath.split("/").pop(); // Get only the filename
        console.log("Attempting to delete old image:", oldPath); // Debug: Log path to delete
        const { error: removeError } = await supabase.storage.from("blog-uploads").remove([
          oldPath
        ]);
        if (removeError) {
          console.error("Failed to delete old image:", removeError);
          return createErrorResponse("Failed to delete old image", 500, removeError.message);
        }
        console.log("Old image deleted successfully:", oldPath); // Debug: Confirm deletion
      }
      // Upload new image
      const ext = imageFile.name.split(".").pop();
      const filename = `blog_${blog_id}_${Date.now()}.${ext}`;
      console.log("Uploading new image:", filename); // Debug: Log new filename
      const { error: uploadError } = await supabase.storage.from("blog-uploads").upload(filename, imageFile, {
        contentType: imageFile.type,
        upsert: true
      });
      if (uploadError) {
        return createErrorResponse("Failed to upload image", 500, uploadError.message);
      }
      const { data: publicData } = supabase.storage.from("blog-uploads").getPublicUrl(filename);
      image_link = publicData?.publicUrl ?? null;
      console.log("New Image Link:", image_link); // Debug: Log new image link
    }
    // Parse and validate blog_tags
    let tagsArray = null;
    if (blog_tags) {
      try {
        tagsArray = JSON.parse(blog_tags); // Expecting JSON array
        if (!Array.isArray(tagsArray)) {
          return createErrorResponse("blog_tags must be a JSON array", 400);
        }
      } catch  {
        // Fallback to comma-separated string if JSON parsing fails
        tagsArray = blog_tags.split(",").map((tag)=>tag.trim()).filter((tag)=>tag);
      }
    }
    // Auto-update published_at if status changes to published
    let published_at = null;
    if (blog_status === "published") {
      const { data: currentBlog } = await supabase.from("blog_posts").select("blog_status").eq("blog_id", blog_id).single();
      if (currentBlog?.blog_status !== "published") {
        published_at = new Date().toISOString();
      }
    }
    // Prepare update fields
    const updateFields = {
      blog_title,
      blog_content,
      updated_at: new Date().toISOString(),
      blog_status
    };
    if (excerpt) updateFields.excerpt = excerpt;
    if (image_link) updateFields.image_link = image_link;
    if (tagsArray) updateFields.blog_tags = tagsArray;
    if (published_at) updateFields.published_at = published_at;
    // Update blog post
    const { error: updateError } = await supabase.from("blog_posts").update(updateFields).eq("blog_id", blog_id);
    if (updateError) {
      return createErrorResponse("Failed to update blog post", 500, updateError.message);
    }
    return createSuccessResponse("Blog post updated successfully");
  } catch (err) {
    console.error("Unhandled error:", err);
    return createErrorResponse("Server error", 500, err.message);
  }
});
