import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
serve(async (req)=>{
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
  const url = new URL(req.url);
  const serviceId = url.searchParams.get("service_id");
  if (!serviceId) {
    return createErrorResponse("Missing service_id parameter", 400);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createErrorResponse("Server configuration error", 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    // Fetch Service Info
    const { data: serviceData, error: serviceError } = await supabase.from("medical_services").select(`
        service_id,
        service_name,
        service_description,
        service_cost,
        image_link,
        service_categories!medical_services_category_id_fkey (
          category_id,
          category_name
        )
      `).eq("service_id", serviceId).single();
    if (serviceError) return createErrorResponse(serviceError.message, 500);
    if (!serviceData) return createSuccessResponse(null, 404);
    // Fetch Doctor IDs linked with this service
    const { data: doctorLinks, error: doctorError } = await supabase.from("doctor_services").select("doctor_id").eq("service_id", serviceId);
    if (doctorError) return createErrorResponse(doctorError.message, 500);
    // Fetch Doctor Details from staff_members
    let doctors = [];
    if (doctorLinks && doctorLinks.length > 0) {
      const doctorIds = doctorLinks.map((doc)=>doc.doctor_id);
      const { data: doctorDetails, error: doctorDetailsError } = await supabase.from("staff_members").select("staff_id, full_name, gender, image_link").in("staff_id", doctorIds);
      if (doctorDetailsError) return createErrorResponse(doctorDetailsError.message, 500);
      // Map doctor details
      doctors = doctorDetails.map((doc)=>{
        let imgUrl = null;
        if (doc.img) {
          const { data: imgPublic } = supabase.storage.from("staff-uploads").getPublicUrl(doc.img);
          imgUrl = imgPublic.publicUrl;
        }
        return {
          id: doc.staff_id,
          fullname: doc.fullname,
          gender: doc.gender,
          img: imgUrl
        };
      });
    }
    // Get public image URL
    let imageUrl = null;
    if (serviceData.image_link) {
      const { data: publicData } = supabase.storage.from("service-uploads").getPublicUrl(serviceData.image_link);
      imageUrl = publicData.publicUrl;
    }
    const responseData = {
      service_id: serviceData.service_id,
      service_name: serviceData.service_name,
      description: serviceData.service_description,
      price: serviceData.service_cost,
      image_link: imageUrl,
      service_categories: serviceData.service_categories,
      doctors
    };
    return createSuccessResponse(responseData);
  } catch (error) {
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
