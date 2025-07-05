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
      error: "Missing Supabase config"
    }, 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    const { data, error } = await supabase.from("medical_services").select("service_id, service_name, excerpt");
    if (error) {
      return createResponse({
        error: error.message
      }, 500);
    }
    const response = data.map((item)=>({
        service_id: item.service_id,
        service_name: item.service_name,
        description: item.excerpt
      }));
    return createResponse(response);
  } catch (err) {
    return createResponse({
      error: "Internal server error",
      details: err.message
    }, 500);
  }
});
