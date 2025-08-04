import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function createErrorResponse(error: string, status = 400, details: string | null = null) {
  const response: any = {
    error,
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

function createSuccessResponse(data: any, status = 200) {
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
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createErrorResponse("Server configuration error", 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { data: doctorData, error: doctorError } = await supabase
      .from("doctor_details")
      .select(`
        doctor_id,
        department,
        speciality,
        educations,
        certifications,
        staff_members (
          full_name,
          image_link,
          gender,
          working_email,
          years_experience,
          hired_at,
          is_available,
          staff_status,
          languages,
          role
        )
      `);

    if (doctorError) {
      return createErrorResponse("Failed to fetch doctor data", 500, doctorError.message);
    }

    if (!doctorData) {
      return createSuccessResponse([]);
    }

    const responseData = await Promise.all(
      doctorData.map(async (doctor) => {
        let imageUrl = null;
        
        if (doctor.staff_members?.image_link) {
          const { data: publicData } = await supabase.storage
            .from("staff-uploads")
            .getPublicUrl(doctor.staff_members.image_link);
          imageUrl = publicData.publicUrl;
        }

        return {
          doctor_id: doctor.doctor_id,
          department: doctor.department,
          speciality: doctor.speciality,
          educations: doctor.educations,
          certifications: doctor.certifications,
          staff_members: {
            full_name: doctor.staff_members?.full_name || null,
            working_email: doctor.staff_members?.working_email || null,
            years_experience: doctor.staff_members?.years_experience || null,
            hired_at: doctor.staff_members?.hired_at || null,
            is_available: doctor.staff_members?.is_available || null,
            staff_status: doctor.staff_members?.staff_status || null,
            languages: doctor.staff_members?.languages || null,
            role: doctor.staff_members?.role || null,
            image_link: imageUrl,
            avatar_url: imageUrl,
            gender: doctor.staff_members?.gender || null,
            // Enhanced display properties
            experience_display: doctor.staff_members?.years_experience 
              ? `${doctor.staff_members.years_experience} ${doctor.staff_members.years_experience === 1 ? 'year' : 'years'}` 
              : 'New doctor',
            availability_status: doctor.staff_members?.is_available 
              ? (doctor.staff_members?.staff_status === 'active' ? 'Available' : 'Temporarily unavailable') 
              : 'Not available'
          }
        };
      })
    );

    return createSuccessResponse(responseData);

  } catch (error) {
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
