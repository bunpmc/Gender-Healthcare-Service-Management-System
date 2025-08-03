import { serve } from 'https://deno.land/std@0.223.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { email, otp_code, new_password } = await req.json();
    if (!email || !otp_code || !new_password) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    const { data: otp, error: otpError } = await supabase.from('otps').select('*').eq('email', email).eq('otp_code', otp_code).eq('is_used', false).gte('expires_at', new Date().toISOString()).maybeSingle();
    if (otpError || !otp) {
      return new Response(JSON.stringify({
        error: 'Invalid or expired OTP'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Truy vấn bảng patients để lấy user_id
const { data: patient, error: patientError } = await supabase
  .from('patients')
  .select('id, email')
  .eq('email', email)
  .maybeSingle();

if (patientError || !patient) {
  return new Response(JSON.stringify({
    error: 'Patient not found'
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status: 404
  });
}

const userId = patient.id;
console.log('✅ Found patient:', {
  id: userId,
  email: patient.email
});
    await supabase.from('otps').update({
      is_used: true
    }).eq('id', otp.id);
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: new_password
    });
    if (updateError) {
      throw new Error('Failed to update password: ' + updateError.message);
    }
    return new Response(JSON.stringify({
      message: 'Password updated successfully'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('❌ Error in OTP verification:', error);
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
