import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function createErrorResponse(
  error: string,
  status = 400,
  details: string | null = null,
) {
  const response = {
    error,
    details,
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
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
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
  // Check for Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return createErrorResponse("Missing or invalid authorization token", 401);
  }
  const accessToken = authHeader.replace("Bearer ", "");
  try {
    // Verify the access token and get user
    const { data: authData, error: authError } = await supabase.auth.getUser(
      accessToken,
    );
    if (authError || !authData.user) {
      return createErrorResponse(
        "Invalid or expired token",
        401,
        authError?.message || null,
      );
    }
    const user_id = authData.user.id;
    // Fetch patient data
    const { data: patient, error: patientError } = await supabase.from(
      "patients",
    ).select(`
        id,
        full_name,
        phone,
        email,
        date_of_birth,
        gender,
        patient_status,
        image_link
      `).eq("id", user_id).single();
    if (patientError) {
      return createErrorResponse(
        "Failed to fetch patient data",
        500,
        patientError.message || null,
      );
    }
    if (!patient) {
      return createErrorResponse("Patient not found", 404);
    }
    // Fetch patient's appointments
    const { data: appointments, error: appointmentError } = await supabase.from(
      "appointments",
    ).select(`
        appointment_id,
        phone,
        email,
        visit_type,
        appointment_status,
        created_at,
        updated_at,
        schedule,
        message,
        doctor_id,
        category_id,
        slot_id,
        appointment_date,
        appointment_time,
        preferred_date,
        preferred_time
      `).eq("patient_id", user_id).order("created_at", {
      ascending: false,
    });
    if (appointmentError) {
      return createErrorResponse(
        "Failed to fetch appointment data",
        500,
        appointmentError.message || null,
      );
    }
    let imageUrl = null;
    if (patient.image_link) {
      try {
        const { data: publicData } = supabase.storage.from("patient-uploads")
          .getPublicUrl(patient.image_link);
        imageUrl = publicData?.publicUrl || null;
      } catch (storageError) {
        console.error("Error fetching image from storage:", storageError);
        imageUrl = null;
      }
    }
    // Format response data
    const responseData = {
      id: patient.id,
      full_name: patient.full_name,
      phone: patient.phone,
      email: patient.email,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      patient_status: patient.patient_status,
      image_link: imageUrl,
      appointments: appointments || [],
    };
    return createSuccessResponse(responseData);
  } catch (error) {
    return createErrorResponse(
      "Internal server error",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
