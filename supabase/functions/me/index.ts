import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function createErrorResponse(
  error: string,
  status = 400,
  details: string | null = null,
) {
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

  try {
    // Get the authenticated user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse("No authorization header provided", 401);
    }

    // Extract token and verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      token,
    );

    if (authError || !user) {
      return createErrorResponse("Unauthorized", 401);
    }

    // Fetch patient data based on user ID
    const { data: patient, error } = await supabase
      .from("patients")
      .select(`
        id,
        full_name,
        phone,
        email,
        date_of_birth,
        gender,
        patient_status,
        image_link      `)
      .eq("id", user.id)
      .single();

    if (error) {
      return createErrorResponse(
        "Failed to fetch patient data",
        500,
        error.message,
      );
    }

    if (!patient) {
      return createErrorResponse("Patient not found", 404);
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
      image_link: patient.image_link,
    };

    return createSuccessResponse(responseData);
  } catch (error) {
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
