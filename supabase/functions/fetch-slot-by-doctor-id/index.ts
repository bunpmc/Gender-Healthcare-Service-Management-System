import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
  // Xử lý CORS preflight
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
  // Lấy doctor_id từ query params
  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctor_id");
  if (!doctorId) {
    return createResponse({
      error: "Missing doctor_id parameter"
    }, 400);
  }
  // Kiểm tra biến môi trường
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createResponse({
      error: "Server configuration error"
    }, 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    // Tính khoảng thời gian 7 ngày
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    const startDate = today.toISOString().split("T")[0]; // e.g., 2025-06-27
    const endDate = sevenDaysLater.toISOString().split("T")[0]; // e.g., 2025-07-03
    // Truy vấn Supabase
    const { data, error } = await supabase.from("doctor_slot_assignments").select(`
        doctor_slot_id,
        appointments_count,
        max_appointments,
        slots (
          slot_id,
          slot_date,
          slot_time,
          is_active
        )
      `).eq("doctor_id", doctorId).gte("slots.slot_date", startDate).lte("slots.slot_date", endDate).eq("slots.is_active", true).not("slots", "is", null) // Loại bỏ các bản ghi có slots null
    .order("slot_date", {
      foreignTable: "slots",
      ascending: true
    }).order("slot_time", {
      foreignTable: "slots",
      ascending: true
    });
    if (error) {
      console.error("Supabase query error:", error);
      return createResponse({
        error: error.message
      }, 500);
    }
    // Kiểm tra và ánh xạ dữ liệu
    const slots = data.filter((assignment)=>assignment.slots != null) // Bỏ các bản ghi có slots null
    .map((assignment)=>({
        doctor_slot_id: assignment.doctor_slot_id,
        appointments_count: assignment.appointments_count,
        max_appointments: assignment.max_appointments,
        slot_id: assignment.slots.slot_id,
        slot_date: assignment.slots.slot_date,
        slot_time: assignment.slots.slot_time,
        is_active: assignment.slots.is_active
      }));
    return createResponse({
      doctor_id: doctorId,
      slots
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return createResponse({
      error: "Internal server error",
      details: error.message
    }, 500);
  }
});
