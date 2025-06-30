// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("OTP Function with Phone Number is running!");

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a random 6-digit OTP
function generateOTP() {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

// Main handler for the edge function
serve(async (req) => {
  try {
    const { action, inputOTP, phoneNumber } = await req.json();

    if (action === "generate") {
      if (!phoneNumber) {
        return new Response(
          JSON.stringify({ success: false, message: "Phone number required" }),
          { headers: { "Content-Type": "application/json" }, status: 400 },
        );
      }

      // Generate OTP and set expiration (e.g., 5 minutes)
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Delete any existing OTP for this phone number to avoid duplicates
      await supabase
        .from("otps")
        .delete()
        .eq("phone_number", phoneNumber);

      // Store new OTP in database
      const { error } = await supabase
        .from("otps")
        .insert({
          phone_number: phoneNumber,
          otp_code: otp,
          expires_at: expiresAt,
        });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          otp: otp,
          message: "OTP generated successfully",
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    } else if (action === "verify") {
      if (!inputOTP || !phoneNumber) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "OTP and phone number required",
          }),
          { headers: { "Content-Type": "application/json" }, status: 400 },
        );
      }

      // Check OTP in database
      const { data, error } = await supabase
        .from("otps")
        .select("*")
        .eq("phone_number", phoneNumber)
        .eq("otp_code", inputOTP)
        .eq("is_used", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, message: "Invalid or expired OTP" }),
          { headers: { "Content-Type": "application/json" }, status: 401 },
        );
      }

      // Mark OTP as used
      await supabase
        .from("otps")
        .update({ is_used: true })
        .eq("id", data.id);

      return new Response(
        JSON.stringify({ success: true, message: "OTP verified successfully" }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid action" }),
        { headers: { "Content-Type": "application/json" }, status: 400 },
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/verify-otp' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
