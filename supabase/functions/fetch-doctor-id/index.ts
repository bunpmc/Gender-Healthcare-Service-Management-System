import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function createErrorResponse(
  error: string,
  status = 400,
  details: string | null = null,
) {
  const response = { error };
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
  // Handle CORS preflight
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

  const url = new URL(req.url);
  const doctor_id = url.searchParams.get("doctor_id");
  const email = url.searchParams.get("email");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createErrorResponse("Server configuration error", 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    if (!doctor_id && !email) {
      return createErrorResponse(
        "Missing query parameter: doctor_id or email",
        400,
      );
    }

    let doctor = supabase.from("doctor_details").select(`
        doctor_id,
        department,
        speciality,
        about_me,
        bio,
        slogan,
        educations,
        certifications,
        license_no,
        staff_members (
          full_name,
          gender,
          image_link,
          working_email,
          years_experience,
          languages
        )
      `);

    let data, error;
    if (doctor_id) {
      ({ data, error } = await doctor.eq("doctor_id", doctor_id).maybeSingle());
    } else {
      const { data: staffData, error: staffError } = await supabase
        .from("staff_members")
        .select("staff_id")
        .eq("working_email", email)
        .maybeSingle();
      if (staffError) {
        return createErrorResponse(
          "Database query error for staff",
          500,
          staffError.message,
        );
      }
      if (!staffData) {
        return createErrorResponse("Doctor not found", 404);
      }
      ({ data, error } = await doctor.eq("doctor_id", staffData.staff_id)
        .maybeSingle());
    }

    if (error) {
      return createErrorResponse("Database query error", 500, error.message);
    }
    if (!data) {
      return createErrorResponse("Doctor not found", 404);
    }

    // Extract image_link from staff_members
    const imageLink = data.staff_members?.image_link;
    let image = null;
    if (imageLink) {
      const { data: publicData, error: publicDataError } = await supabase
        .storage.from("user-uploads")
        .getPublicUrl(imageLink);
      if (publicDataError) {
        console.error("Storage error:", publicDataError.message);
      } else {
        image = publicData.publicUrl;
      }
    }

    // Fetch blog data
    const { data: blogData, error: blogError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("doctor_id", data.doctor_id)
      .eq("blog_status", "published");
    if (blogError) {
      return createErrorResponse(
        "Failed to fetch blog data",
        500,
        blogError.message,
      );
    }

    // Prepare response data
    const responseData = {
      doctor_id: data.doctor_id,
      department: data.department,
      speciality: data.speciality,
      bio: data.bio,
      slogan: data.slogan,
      educations: data.educations,
      certifications: data.certifications,
      about_me: data.about_me,
      license_no: data.license_no,
      staff_members: {
        full_name: data.staff_members?.full_name,
        gender: data.staff_members?.gender,
        image_link: image,
        working_email: data.staff_members?.working_email,
        years_experience: data.staff_members?.years_experience,
        languages: data.staff_members?.languages,
      },
      blogs: blogData
        ? blogData.map((blog) => ({
          blog_id: blog.blog_id,
          title: blog.title,
          content: blog.content,
          image_link: blog.image_link,
          created_at: blog.created_at,
          updated_at: blog.updated_at,
          doctor_id: blog.doctor_id,
        }))
        : [],
    };

    return createSuccessResponse(responseData);
  } catch (error) {
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
