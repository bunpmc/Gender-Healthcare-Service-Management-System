// supabase/functions/send-otp/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// CORS headers trực tiếp
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Xử lý preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { email } = await req.json();
    // Kiểm tra email hợp lệ
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({
        error: 'Email không hợp lệ'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Tạo Supabase client dùng SERVICE_ROLE_KEY
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: userList, error: userError } = await supabase.auth.admin.listUsers({
      email
    });
    if (userError || !userList?.users || userList.users.length === 0) {
      return new Response(JSON.stringify({
        error: 'Email không tồn tại trong hệ thống'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 404
      });
    }
    // Gửi OTP qua Supabase Auth
    const { error: otpError } = await supabase.auth.resetPasswordForEmail(email);
    if (otpError) {
      throw new Error('Không thể gửi OTP: ' + otpError.message);
    }
    // Trả về timestamp để kiểm soát thời hạn OTP
    const timestamp = Date.now();
    return new Response(JSON.stringify({
      message: 'OTP đã được gửi qua email',
      timestamp
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
