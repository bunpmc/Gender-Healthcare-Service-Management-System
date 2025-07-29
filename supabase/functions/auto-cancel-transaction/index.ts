// File: supabase/functions/auto-cancel-transactions/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req)=>{
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString(); //to ms
  // Update old transactions to 'cancel'
  const { error, count } = await supabase.from("transactions").update({
    status: "cancel"
  }).eq("status", "pending") // only cancel pending ones
  .lt("created_at", tenMinutesAgo) // older than 10 mins
  .select("id", {
    count: "exact"
  });
  if (error) {
    console.error("Auto-cancel failed:", error);
    return new Response("Failed to auto-cancel", {
      status: 500
    });
  }
  return new Response(`Auto-canceled ${count} transactions.`, {
    status: 200
  });
});
