import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Helper Response
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
serve(async (req)=>{
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      }
    });
  }
  // Chỉ cho phép GET
  if (req.method !== "GET") {
    return createResponse({
      error: "Method not allowed"
    }, 405);
  }
  // Lấy doctor_id từ query param
  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctor_id");
  if (!doctorId) {
    return createResponse({
      error: "Missing doctor_id parameter"
    }, 400);
  }
  // Supabase init
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createResponse({
      error: "Supabase config error"
    }, 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    // 1. Lấy thông tin doctor từ staff_members
    const { data: staffData, error: staffError } = await supabase.from("staff_members").select("staff_id, full_name, gender, image_link").eq("staff_id", doctorId).single();
    if (staffError || !staffData) {
      return createResponse({
        error: "Doctor not found"
      }, 404);
    }
    // 2. Lấy specialization từ doctor_details
    const { data: doctorDetailData, error: detailError } = await supabase.from("doctor_details").select("speciality").eq("doctor_id", doctorId).single();
    const specialization = doctorDetailData?.speciality || null;
    // 3. Lấy services (join với medical_services để có service_name)
    const { data: serviceLinks, error: serviceError } = await supabase.from("doctor_services").select(`
        service_id,
        medical_services (
          service_name
        )
      `).eq("doctor_id", doctorId);
    if (serviceError) {
      console.error("Error fetching services:", serviceError);
    }
    const services = (serviceLinks || []).map((item)=>({
        service_id: item.service_id,
        service_name: item.medical_services?.service_name || null
      }));
    // 4. Trả về kết quả
    const responseData = {
      doctor_id: staffData.staff_id,
      full_name: staffData.full_name,
      gender: staffData.gender,
      image_link: staffData.image_link,
      specialization,
      services
    };
    return createResponse(responseData);
  } catch (error) {
    console.error("Unexpected error:", error);
    return createResponse({
      error: "Internal server error",
      details: error.message
    }, 500);
  }
});
