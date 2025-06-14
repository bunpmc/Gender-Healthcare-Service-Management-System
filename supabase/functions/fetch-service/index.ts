import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function createErrorResponse(error, status = 400, details = null) {
  const response = {
    error,
  };
  if (details) response.details = details;
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
function createSuccessResponse(data, status = 200) {
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
    const { data: serviceData, error: serviceError } = await supabase.from(
      "medical_services",
    ).select(`
        service_id,
        service_name,
        overall,
        service_image,
        service_cost,
        duration_minutes,
        image_link
        )
      `);
    if (serviceError) {
      return createErrorResponse(
        serviceError.message,
        500,
      );
    }
    if (!serviceData) {
      return createSuccessResponse([]);
    }
    const responseData = await Promise.all(serviceData.map(async (service) => {
      let imageUrl = null;
      if (service?.image_link) {
        const { data: publicData } = await supabase.storage.from(
          "service-uploads",
        )
          .getPublicUrl(service.image_link);
        imageUrl = publicData.publicUrl;
      }
      return {
        id: service.service_id,
        name: service.service_name,
        overall: service.overall,
        price: service.service_cost,
        duration: service.duration_minutes,
        image_link: imageUrl,
      };
    }));
    return createSuccessResponse(responseData);
  } catch (error) {
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
