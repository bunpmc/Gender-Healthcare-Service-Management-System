import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function createErrorResponse(error: string, status = 400, details: string | null = null) {
  const response: Record<string, unknown> = { error };
  if (details) response.details = details;
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function createSuccessResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
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
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      }
    });
  }

  if (req.method !== "GET") {
    return createErrorResponse("Method not allowed", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return createErrorResponse("Missing Supabase config", 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Lấy thông tin từ bảng doctor_details và staff_members
    const { data: doctorData, error: doctorError } = await supabase.from("doctor_details").select(`
      doctor_id,
      speciality,
      staff_members (
        full_name,
        image_link,
        gender
      )
    `);

    if (doctorError) {
      return createErrorResponse("Failed to fetch doctor details", 500, doctorError.message);
    }

    if (!doctorData || doctorData.length === 0) {
      return createSuccessResponse([]);
    }

    // Map từng doctor để lấy thêm service_id
    const responseData = await Promise.all(
      doctorData.map(async (doctor) => {
        // Lấy avatar
        let imageUrl: string | null = null;
        if (doctor.staff_members?.image_link) {
          const { data: publicData } = await supabase.storage
            .from("staff-uploads")
            .getPublicUrl(doctor.staff_members.image_link);
          imageUrl = publicData?.publicUrl || null;
        }

        // Lấy service_id
        const { data: serviceLinks, error: serviceError } = await supabase
          .from("doctor_services")
          .select("service_id")
          .eq("doctor_id", doctor.doctor_id);

        const services = (serviceLinks || []).map((s) => s.service_id);

        return {
          doctor_id: doctor.doctor_id,
          full_name: doctor.staff_members?.full_name || null,
          image_link: imageUrl,
          gender: doctor.staff_members?.gender || null,
          specialization: doctor.speciality || null,
          services
        };
      })
    );

    return createSuccessResponse(responseData);
  } catch (error) {
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
