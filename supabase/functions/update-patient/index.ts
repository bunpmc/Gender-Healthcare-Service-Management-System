import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function createErrorResponse(error: string, status = 400, details: string | null = null) {
  const response: { error: string; details?: string } = { error };
  if (details) response.details = details;
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function createSuccessResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  try {
    // Get the authenticated user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse("No authorization header provided", 401);
    }

    // Extract token and verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse("Unauthorized", 401);
    }

    // Parse multipart form-data
    const formData = await req.formData();

    // Extract patient data fields
    const patient_id = formData.get("patient_id")?.toString();
    const full_name = formData.get("full_name")?.toString();
    const phone = formData.get("phone")?.toString();
    const email = formData.get("email")?.toString();
    const date_of_birth = formData.get("date_of_birth")?.toString();
    const gender = formData.get("gender")?.toString();
    const allergies = formData.get("allergies") ? JSON.parse(formData.get("allergies") as string) : null;
    const chronic_conditions = formData.get("chronic_conditions") ? JSON.parse(formData.get("chronic_conditions") as string) : null;
    const past_surgeries = formData.get("past_surgeries") ? JSON.parse(formData.get("past_surgeries") as string) : null;
    const vaccination_status = formData.get("vaccination_status")?.toString();
    const patient_status = formData.get("patient_status")?.toString();
    const bio = formData.get("bio")?.toString();

    // Validate required fields
    if (!patient_id || patient_id !== user.id) {
      return createErrorResponse("Invalid or unauthorized patient_id", 403);
    }
    if (!full_name || !phone || !email || !date_of_birth || !gender) {
      return createErrorResponse("Missing required patient fields", 400);
    }

    // Initialize image_link
    let image_link: string | null = null;
    let image_url: string | null = null;

    // Handle image upload if provided
    const file = formData.get("image");
    if (file && file instanceof File) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        return createErrorResponse("Invalid file type. Only JPEG, PNG, and GIF are allowed.", 400);
      }

      // Generate a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${file.name}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("patient-uploads")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        return createErrorResponse("Failed to upload image", 500, uploadError.message);
      }

      // Get the public URL
      const { data: publicData } = supabase.storage
        .from("patient-uploads")
        .getPublicUrl(fileName);

      if (!publicData?.publicUrl) {
        return createErrorResponse("Failed to retrieve image URL", 500);
      }

      image_link = fileName;
      image_url = publicData.publicUrl;
    }

    // Prepare patient data for update
    const patientData: { [key: string]: any } = {
      full_name,
      phone,
      email,
      date_of_birth,
      gender,
      allergies,
      chronic_conditions,
      past_surgeries,
      vaccination_status,
      patient_status,
      bio,
      updated_at: new Date().toISOString(),
    };

    // Only include image_link if an image was uploaded
    if (image_link) {
      patientData.image_link = image_link;
    }

    // Update patient data in the database
    const { data: updatedPatient, error: patientError } = await supabase
      .from("patients")
      .update(patientData)
      .eq("id", patient_id)
      .select(`
        id,
        full_name,
        phone,
        email,
        date_of_birth,
        gender,
        allergies,
        chronic_conditions,
        past_surgeries,
        vaccination_status,
        patient_status,
        created_at,
        updated_at,
        image_link,
        bio
      `)
      .single();

    if (patientError) {
      return createErrorResponse("Failed to update patient data", 500, patientError.message);
    }

    if (!updatedPatient) {
      return createErrorResponse("Patient not found", 404);
    }

    // Prepare response
    const responseData = {
      patient: {
        id: updatedPatient.id,
        full_name: updatedPatient.full_name,
        phone: updatedPatient.phone,
        email: updatedPatient.email,
        date_of_birth: updatedPatient.date_of_birth,
        gender: updatedPatient.gender,
        allergies: updatedPatient.allergies,
        chronic_conditions: updatedPatient.chronic_conditions,
        past_surgeries: updatedPatient.past_surgeries,
        vaccination_status: updatedPatient.vaccination_status,
        patient_status: updatedPatient.patient_status,
        created_at: updatedPatient.created_at,
        updated_at: updatedPatient.updated_at,
        image_link: updatedPatient.image_link,
        bio: updatedPatient.bio,
      },
      image_url: image_url || updatedPatient.image_link || null,
      message: "Patient data updated successfully" + (image_url ? " with image upload" : ""),
    };

    return createSuccessResponse(responseData);
  } catch (error) {
    return createErrorResponse("Internal server error", 500, error.message);
  }
});