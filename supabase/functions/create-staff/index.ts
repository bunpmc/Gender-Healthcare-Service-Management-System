// Setup type definitions for Supabase Edge Runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: "Server config error" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();

    const { full_name, working_email, role, years_experience, hired_at, is_available, staff_status, gender, languages, image_link } = body;

    if (!full_name || !working_email) {
      return new Response(JSON.stringify({ error: "Missing required fields: full_name, working_email" }), { status: 400 });
    }

    // Step 1: Create user in Auth
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: working_email,
      email_confirm: true
    });

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Failed to create user in Auth", details: userError?.message }), { status: 500 });
    }

    const staffId = user.user.id;

    // Step 2: Insert staff profile
    const { error: insertError } = await supabase.from("staff_members").insert([{
      staff_id: staffId,
      full_name,
      working_email,
      role,
      years_experience,
      hired_at,
      is_available,
      staff_status,
      gender,
      languages,
      image_link
    }]);

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to insert staff profile", details: insertError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: "Staff member created successfully", staff_id: staffId }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
