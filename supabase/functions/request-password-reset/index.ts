import { serve } from 'https://deno.land/std@0.223.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.1.0/mod.ts';
// CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
// OTP generator
function generateOTP(length = 6) {
  let otp = '';
  for(let i = 0; i < length; i++){
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}
// Supabase client
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
// SMTP client
const smtpClient = new SMTPClient({
  connection: {
    hostname: 'smtp.gmail.com',
    port: 587,
    auth: {
      username: Deno.env.get('SMTP_USER') ?? '',
      password: Deno.env.get('SMTP_PASS') ?? ''
    }
  }
});
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({
        error: 'Invalid email'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Kiểm tra email trong bảng patients
    const { data: patient, error: patientError } = await supabase.from('patients').select('id').eq('email', email).single();
    if (patientError || !patient) {
      return new Response(JSON.stringify({
        error: 'Email not found in the system'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 404
      });
    }
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
    // Lưu OTP vào bảng otps
    const { error: upsertError } = await supabase.from('otps').upsert({
      email: email,
      otp_code: otpCode,
      expires_at: expiresAt.toISOString(),
      is_used: false,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'email'
    });
    if (upsertError) {
      throw new Error('Unable to store OTP: ' + upsertError.message);
    }
    // Gửi OTP dạng plain text
    await smtpClient.send({
      from: `OTP System <${Deno.env.get('SMTP_USER')}>`,
      to: email,
      subject: 'Your OTP Code',
      content: `Your OTP code is: ${otpCode}\nThis code is valid for 5 minutes.\nDo not share this code with anyone.`
    });
    return new Response(JSON.stringify({
      message: 'OTP has been sent to your email',
      timestamp: Date.now()
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
