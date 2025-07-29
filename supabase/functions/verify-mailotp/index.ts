import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req)=>{
  try {
    const { email, token, type } = await req.json();
    if (!email || !token || !type) {
      return new Response(JSON.stringify({
        error: "Missing required fields"
      }), {
        status: 400
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const { data: verifyResult, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type
    });
    if (error || !verifyResult.session || !verifyResult.user) {
      console.error("OTP verification failed:", error);
      return new Response(JSON.stringify({
        error: "OTP verification failed"
      }), {
        status: 401
      });
    }
    const user = verifyResult.user;
    // ✅ Chỉ insert nếu là đăng ký mới
    if (type === "signup") {
      const { data: existingPatient } = await supabase.from("patients").select("id").eq("id", user.id).maybeSingle();
      if (!existingPatient) {
        console.log("Inserting patient...");
        // // ✅ Hàm tạo số điện thoại ngẫu nhiên VN đảm bảo không trùng
        // async function generateUniquePhone() {
        //   let phone = "";
        //   let exists = true;
        //   while(exists){
        //     phone = "09" + Math.floor(10000000 + Math.random() * 90000000).toString();
        //     const { data: phoneCheck } = await supabase.from("patients").select("id").eq("phone", phone).maybeSingle();
        //     exists = !!phoneCheck;
        //   }
        //   return phone;
        // }
        // const phone = await generateUniquePhone();
        const patientData = {
          id: user.id,
          email,
          full_name: user.user_metadata?.full_name || "User",
          gender: "other"
        };
        const { error: insertError } = await supabase.from("patients").insert(patientData);
        if (insertError) {
          console.error("Insert patient error:", insertError);
        } else {
          console.log("✅ Patient inserted successfully:");
        }
      }
    }
    // ✅ Trả về session và user nếu xác thực thành công
    return new Response(JSON.stringify({
      message: "OTP verified",
      session: verifyResult.session
    }), {
      status: 200
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500
    });
  }
});
