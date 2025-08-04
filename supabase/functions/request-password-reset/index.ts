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
    tls: false,
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
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 405
      });
    }
    // Kiểm tra biến môi trường
    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      return new Response(JSON.stringify({
        error: 'Server config error'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    if (!Deno.env.get('SMTP_USER') || !Deno.env.get('SMTP_PASS')) {
      return new Response(JSON.stringify({
        error: 'SMTP configuration missing (user or pass)'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
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
    let userFound = false;
    let { data: patient, error: patientError } = await supabase.from('patients').select('id').eq('email', email).single();
    if (patientError || !patient) {
      // Kiểm tra trong bảng staff_members nếu không tìm thấy trong patients
      const { data: staff, error: staffError } = await supabase.from('staff_members').select('staff_id').eq('working_email', email).single();
      if (staffError || !staff) {
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
      userFound = true;
    } else {
      userFound = true;
    }
    if (!userFound) {
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
    // Gửi OTP với mẫu HTML chuyên nghiệp
    try {
      await smtpClient.send({
        from: `Gender Care <${Deno.env.get('SMTP_USER')}>`,
        to: email,
        subject: 'Your OTP Code for Gender Care',
        content: `Dear Valued Customer,\n\nThank you for using Gender Care services. Your One-Time Password (OTP) for account verification is: ${otpCode}\n\nThis code is valid for 5 minutes. Please use it to complete your verification process.\n\nFor your security, do not share this OTP with anyone.\n\nIf you have any questions or need assistance, feel free to contact our support team at support@gendercare.com.\n\nThanks,\nGender Care Team`,
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:Arial,sans-serif;background-color:#f4f4f4;margin:0;padding:0}.container{max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}.header{background-color:#007bff;color:#ffffff;padding:20px;text-align:center;border-top-left-radius:8px;border-top-right-radius:8px}.content{padding:20px}.otp-code{font-size:24px;font-weight:bold;color:#007bff;text-align:center;margin:20px 0;padding:10px;background-color:#f9f9f9;border-radius:5px}.content p{color:#555555;line-height:1.6}.footer{text-align:center;padding:10px;color:#999999;font-size:12px}</style></head><body><div class="container"><div class="header"><h1>Your OTP Code</h1></div><div class="content"><p>Dear Valued Customer,</p><p>Thank you for using Gender Care services. Your One-Time Password (OTP) for account verification is:</p><div class="otp-code">${otpCode}</div><p>This code is valid for <strong>5 minutes</strong>. Please use it to complete your verification process.</p><p>For your security, do not share this OTP with anyone.</p><p>If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:support@gendercare.com">support@gendercare.com</a>.</p></div><div class="footer"><p>&copy; ${new Date().getFullYear()} Gender Care. All rights reserved.</p><p>Contact us at <a href="mailto:support@gendercare.com">support@gendercare.com</a></p></div></div></body></html>`
      });
    } catch (emailError) {
      return new Response(JSON.stringify({
        error: 'Failed to send OTP email',
        details: emailError.message
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
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
