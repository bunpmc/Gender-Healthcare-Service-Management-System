import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Helper response
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
  // Handle CORS preflight
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
    return createResponse({
      error: "Method not allowed"
    }, 405);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createResponse({
      error: "Server configuration error"
    }, 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    const startDate = today.toISOString().split("T")[0];
    const endDate = sevenDaysLater.toISOString().split("T")[0];
    const { data, error } = await supabase.from("doctor_slot_assignments").select(`
        doctor_slot_id,
        doctor_id,
        slots (
          slot_date,
          slot_time
        )
      `).gte("slots.slot_date", startDate).lte("slots.slot_date", endDate).eq("slots.is_active", true).not("slots", "is", null).order("slot_date", {
      foreignTable: "slots",
      ascending: true
    }).order("slot_time", {
      foreignTable: "slots",
      ascending: true
    });
    if (error) {
      console.error("Supabase error:", error);
      return createResponse({
        error: error.message
      }, 500);
    }
    const slots = data.filter((assignment)=>assignment.slots != null).map((assignment)=>({
        doctor_slot_id: assignment.doctor_slot_id,
        doctor_id: assignment.doctor_id,
        slot_date: assignment.slots.slot_date,
        slot_time: assignment.slots.slot_time
      }));
    return createResponse({
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
