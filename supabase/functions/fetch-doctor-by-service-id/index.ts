import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function createResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
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
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  if (req.method !== "GET") {
    return createResponse({ error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const serviceId = url.searchParams.get("service_id");
  if (!serviceId) {
    return createResponse({ error: "Missing service_id parameter" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createResponse({ error: "Supabase config missing" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // 1. Lấy danh sách doctor_id theo service_id
    const { data: doctorLinks, error: doctorLinkError } = await supabase
      .from("doctor_services")
      .select("doctor_id")
      .eq("service_id", serviceId);

    if (doctorLinkError) {
      return createResponse({ error: doctorLinkError.message }, 500);
    }

    if (!doctorLinks || doctorLinks.length === 0) {
      return createResponse({ doctors: [] });
    }

    const doctorIds = doctorLinks.map((doc) => doc.doctor_id);

    // 2. Lấy thông tin chi tiết doctor từ staff_members
    const { data: doctors, error: doctorError } = await supabase
      .from("staff_members")
      .select("staff_id, full_name, gender, image_link")
      .in("staff_id", doctorIds);

    if (doctorError) {
      return createResponse({ error: doctorError.message }, 500);
    }

    // 3. Xử lý trả public image link (nếu có)
    const doctorList = doctors.map((doc) => {
      let imgUrl = null;
      if (doc.image_link) {
        const { data: publicImg } = supabase.storage.from("staff-uploads").getPublicUrl(doc.image_link);
        imgUrl = publicImg.publicUrl;
      }
      return {
        id: doc.staff_id,
        fullname: doc.full_name,
        gender: doc.gender,
        img: imgUrl,
      };
    });

    return createResponse({ doctors: doctorList });
  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
});
