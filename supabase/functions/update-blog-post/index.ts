import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function createErrorResponse(error: string, status = 400, details: string | null = null) {
  const response: any = { error };
  if (details) response.details = details;
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function createSuccessResponse(message: string) {
  return new Response(JSON.stringify({ message }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

serve(async (req) => {
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
    return createErrorResponse("Method not allowed", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return createErrorResponse("Supabase config missing", 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return createErrorResponse("No authorization header provided", 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return createErrorResponse("Unauthorized", 401);

    const formData = await req.formData();

    const blog_id = formData.get("blog_id")?.toString();
    const blog_title = formData.get("blog_title")?.toString();
    const blog_content = formData.get("blog_content")?.toString();
    const excerpt = formData.get("excerpt")?.toString();
    const blog_tags = formData.get("blog_tags")?.toString();

    if (!blog_id || !blog_title || !blog_content) {
      return createErrorResponse("Missing required fields", 400);
    }

    const { data: existingBlog, error: fetchError } = await supabase
      .from("blog_posts")
      .select("doctor_id, image_link")
      .eq("blog_id", blog_id)
      .single();

    if (fetchError) return createErrorResponse("Failed to fetch blog", 500, fetchError.message);
    if (existingBlog.doctor_id !== user.id) {
      return createErrorResponse("Unauthorized: You are not the owner of this blog", 403);
    }

    const image = formData.get("image");
    let image_link = null;

    if (image && image instanceof File) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(image.type)) {
        return createErrorResponse("Invalid file type. Only JPEG, PNG, WEBP allowed.", 400);
      }

      if (existingBlog.image_link && !existingBlog.image_link.includes("blog_bg.webp")) {
        const oldPath = existingBlog.image_link.startsWith("post-uploads/")
          ? existingBlog.image_link.replace("post-uploads/", "")
          : existingBlog.image_link;

        await supabase.storage.from("post-uploads").remove([oldPath]);
      }

      const ext = image.name.split(".").pop();
      const fileName = `blog_${blog_id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("post-uploads")
        .upload(fileName, image, {
          contentType: image.type,
          upsert: true
        });

      if (uploadError) {
        return createErrorResponse("Failed to upload image", 500, uploadError.message);
      }

      image_link = fileName;
    }

    const updateFields: any = {
      blog_title,
      blog_content,
      updated_at: new Date().toISOString()
    };

    if (excerpt) updateFields.excerpt = excerpt;
    if (image_link) updateFields.image_link = image_link;
    if (blog_tags) {
      try {
        updateFields.blog_tags = JSON.parse(blog_tags);
      } catch {
        return createErrorResponse("Invalid JSON format for blog_tags", 400);
      }
    }

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update(updateFields)
      .eq("blog_id", blog_id);

    if (updateError) {
      return createErrorResponse("Failed to update blog", 500, updateError.message);
    }

    return createSuccessResponse("Blog updated successfully");
  } catch (error) {
    console.error("Unhandled error:", error);
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
