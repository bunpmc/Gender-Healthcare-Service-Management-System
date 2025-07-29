// supabase/functions/verify-otp/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { email, otp, newPassword, timestamp } = await req.json();
    // Kiểm tra đầu vào
    if (!email || !otp || !newPassword || !timestamp || typeof timestamp !== 'number') {
      return new Response(JSON.stringify({
        error: 'Thiếu thông tin: email, OTP, mật khẩu mới hoặc timestamp'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Kiểm tra thời gian hết hạn OTP
    const now = Date.now();
    const expiresInMinutes = 10; // 10 phút
    if ((now - timestamp) / 1000 / 60 > expiresInMinutes) {
      return new Response(JSON.stringify({
        error: 'OTP đã hết hạn'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Tạo Supabase client
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Xác minh OTP
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery'
    });
    if (verifyError || !data) {
      return new Response(JSON.stringify({
        error: 'OTP không hợp lệ hoặc đã hết hạn'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Lấy user ID
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({
      email
    });
    if (userError || !users || users.users.length === 0) {
      throw new Error('Không tìm thấy người dùng với email đã cho');
    }
    // Kiểm tra độ mạnh mật khẩu (tùy chọn)
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return new Response(JSON.stringify({
        error: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa và số'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Cập nhật mật khẩu
    const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
      password: newPassword
    });
    if (updateError) {
      throw new Error('Không thể cập nhật mật khẩu: ' + updateError.message);
    }
    return new Response(JSON.stringify({
      message: 'Cập nhật mật khẩu thành công'
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
