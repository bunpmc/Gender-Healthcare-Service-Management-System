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
serve(async (req) => {
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
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return createResponse({
      error: "Server configuration error"
    }, 500);
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
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
    const slots = data.filter((assignment) => assignment.slots != null).map((assignment) => ({
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

// curl -X GET "http://127.0.0.1:54321/functions/v1/fetch-slots" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" -H "Content-Type: application/json"

// curl -X POST "http://127.0.0.1:54321/functions/v1/vnpay-payment" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eHhvZHhwbHlldGVjcnNieG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTE2MjAsImV4cCI6MjA2NTE4NzYyMH0.O60A63ihSaQ_2qbLozpU04yy7ZB5h8BUZqEvWWCLnf0"-H "Content-Type: application/json" -d '{"amount":"150000","orderInfo":"Payment for order #12345","patientId":"dfc1b883-47f7-40db-91ee-16424e212b37","services":["Consultation"]}'
