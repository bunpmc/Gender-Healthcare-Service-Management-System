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
  // Initialize Supabase
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
    // Parse form data
    const formData = await req.formData();
    const staff_id = formData.get("staff_id")?.toString();
    const imageFile = formData.get("image");
    // Validate required fields
    if (!staff_id) {
      return createErrorResponse("Missing required field: staff_id", 400);
    }
    // Check if staff member exists
    const { data: existingStaff, error: fetchError } = await supabase.from("staff_members").select("image_link").eq("staff_id", staff_id).single();
    if (fetchError || !existingStaff) {
      return createErrorResponse("Staff member not found", 404, fetchError?.message);
    }
    // Handle image (optional)
    let image_link = existingStaff.image_link;
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];
      if (!allowedTypes.includes(imageFile.type)) {
        return createErrorResponse("Invalid image type. Only JPEG, PNG, WEBP allowed.", 400);
      }
      // Delete old image if it exists and isn't a default
      // if (image_link && !image_link.includes("default.jpg")) {
      if (image_link && image_link.split('/').pop() !== "default.jpg") {
        let oldPath = image_link;
        if (image_link.includes("/staff-uploads/")) {
          const parts = image_link.split("/staff-uploads/");
          oldPath = parts[1] ? parts[1] : image_link;
        } else if (image_link.startsWith("staff-uploads/")) {
          oldPath = image_link.replace("staff-uploads/", "");
        }
        oldPath = oldPath.split("/").pop(); // Get only the filename
        console.log("Attempting to delete old image:", oldPath); // Debug: Log path to delete
        const { error: removeError } = await supabase.storage.from("staff-uploads").remove([
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
      const filename = `${staff_id.replace(/[-]/g, "_")}.${ext}`;
      console.log("Uploading new image:", filename); // Debug: Log new filename
      const { error: uploadError } = await supabase.storage.from("staff-uploads").upload(filename, imageFile, {
        contentType: imageFile.type,
        upsert: true
      });
      if (uploadError) {
        return createErrorResponse("Failed to upload image", 500, uploadError.message);
      }
      const { data: publicData } = supabase.storage.from("staff-uploads").getPublicUrl(filename);
      image_link = filename;
      console.log("New Image Link:", image_link); // Debug: Log new image link
    } else {
      return createErrorResponse("No image provided for update", 400);
    }
    // Prepare update fields (only image_link and updated_at)
    const updateFields = {
      image_link,
      updated_at: new Date().toISOString()
    };
    // Update staff member
    const { error: updateError } = await supabase.from("staff_members").update(updateFields).eq("staff_id", staff_id);
    if (updateError) {
      return createErrorResponse("Failed to update staff member image", 500, updateError.message);
    }
    return createSuccessResponse("Staff member image updated successfully");
  } catch (err) {
    console.error("Unhandled error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return createErrorResponse("Server error", 500, errorMessage);
  }
});
