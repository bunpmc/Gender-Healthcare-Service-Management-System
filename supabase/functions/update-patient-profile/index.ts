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
function createSuccessResponse(message, data = null) {
  return new Response(JSON.stringify({
    message,
    data
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
    const id = formData.get("id")?.toString();
    const full_name = formData.get("full_name")?.toString();
    const phone = formData.get("phone")?.toString();
    const email = formData.get("email")?.toString();
    const date_of_birth = formData.get("date_of_birth")?.toString();
    const gender = formData.get("gender")?.toString();
    const allergies = formData.get("allergies")?.toString();
    const chronic_conditions = formData.get("chronic_conditions")?.toString();
    const past_surgeries = formData.get("past_surgeries")?.toString();
    const vaccination_status = formData.get("vaccination_status")?.toString();
    const bio = formData.get("bio")?.toString();
    // Validate required fields
    if (!id || !full_name) {
      return createErrorResponse("Missing required fields: id, full_name", 400);
    }
    // Validate date_of_birth
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      const currentDate = new Date();
      if (isNaN(dob.getTime())) {
        return createErrorResponse("Invalid date_of_birth format", 400);
      }
      if (dob > currentDate) {
        return createErrorResponse("Date of birth cannot be in the future", 400);
      }
    }
    // Check if patient exists
    const { data: existingPatient, error: fetchError } = await supabase.from("patients").select("id").eq("id", id).single();
    if (fetchError || !existingPatient) {
      return createErrorResponse("Patient not found", 404, fetchError?.message);
    }
    // Set default image link for every update
    const image_link = `${supabaseUrl}/storage/v1/object/public/patient-uploads/default.jpg`;
    console.log("Using default image link:", image_link); // Debug: Log default image link
    // Prepare update fields
    const updateFields = {
      full_name,
      phone,
      email,
      date_of_birth,
      gender,
      allergies,
      chronic_conditions,
      past_surgeries,
      vaccination_status,
      bio,
      image_link,
      updated_at: new Date().toISOString()
    };
    // Update patient data
    const { error: updateError } = await supabase.from("patients").update(updateFields).eq("id", id);
    if (updateError) {
      return createErrorResponse("Failed to update patient", 500, updateError.message);
    }
    return createSuccessResponse("Patient profile updated successfully", {
      id,
      full_name,
      image_link
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return createErrorResponse("Server error", 500, err.message);
  }
});
