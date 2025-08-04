import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv/load.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const config = {
  vnp_TmnCode: Deno.env.get("VNPAY_TMN_CODE") || "",
  vnp_HashSecret: Deno.env.get("VNPAY_HASH_SECRET") || "",
  vnp_Url: Deno.env.get("VNPAY_URL") ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: Deno.env.get("VNPAY_RETURN_URL") ||
    "https://fe-gender-healthcare-service-manage.vercel.app/payment-result",
  vnp_Version: "2.1.0",
  vnp_Command: "pay",
  vnp_CurrCode: "VND",
  supabaseUrl: Deno.env.get("SUPABASE_URL") || "",
  supabaseKey: Deno.env.get("SUPABASE_ANON_KEY") || "",
};

console.log("config", config);

const supabase = createClient(config.supabaseUrl, config.supabaseKey);
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hour}${minute}${second}`;
}

function sortObjectByKey(obj: Record<string, string>): string {
  const sorted = Object.keys(obj).sort().reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {} as Record<string, string>);
  return new URLSearchParams(sorted).toString();
}

async function generateVNPaySignature(
  params: string,
  secretKey: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    {
      name: "HMAC",
      hash: "SHA-512",
    },
    false,
    [
      "sign",
    ],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(params),
  );
  return Array.from(new Uint8Array(signature)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}
function getClientIP(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  const xRealIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  return xForwardedFor && xForwardedFor.split(",")[0].trim() || xRealIP ||
    cfConnectingIP || "127.0.0.1";
}

async function logMessage(message: any): Promise<void> {
  try {
    const { error } = await supabase.from("logs").insert({
      message,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Error logging message:", error);
  }
}

async function saveTransaction(
  orderId: string,
  amount: number,
  orderInfo: string,
  patientId: string | undefined,
  services: string[] | null,
): Promise<void> {
  try {
    const { error } = await supabase.from("transactions").insert({
      order_id: orderId,
      amount,
      order_info: orderInfo,
      patient_id: patientId || "unknown",
      services,
      status: "pending",
    });
    if (error) throw error;
  } catch (error) {
    console.error("Error saving transaction:", error);
  }
}
serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST method",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  // Parse request body
  let body: any;
  try {
    body = await req.json();
  } catch (error) {
    console.error("JSON parsing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid JSON body",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
  // Validate required fields
  if (!body.amount) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Amount is required",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  const amount = Number(body.amount);
  const orderInfo = body.orderInfo || "Payment from Edge Function";
  const patientId = body.patientId;
  const services = body.services || null;

  // Validate amount
  if (!amount || amount <= 0 || isNaN(amount)) {
    await logMessage({
      error: "Invalid amount",
      amount: body.amount,
      request: body,
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Amount must be a positive number",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
  const now = new Date(new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
  }));
  const orderId = `VNP_${Date.now()}_${
    Math.random().toString(36).substring(2, 11).toUpperCase()
  }`;
  const createDate = formatDate(now);
  const expireDate = formatDate(new Date(now.getTime() + 15 * 60 * 1000));
  const clientIP = getClientIP(req);
  const paymentParams = {
    vnp_Version: config.vnp_Version,
    vnp_Command: config.vnp_Command,
    vnp_TmnCode: config.vnp_TmnCode,
    vnp_Amount: (amount * 100).toString(),
    vnp_CurrCode: config.vnp_CurrCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: clientIP,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };
  await logMessage({
    paymentParams,
    clientIP,
    request: body,
  });
  try {
    const signData = sortObjectByKey(paymentParams);
    const signature = await generateVNPaySignature(
      signData,
      config.vnp_HashSecret,
    );
    const paymentUrl =
      `${config.vnp_Url}?${signData}&vnp_SecureHash=${signature}`;
    // Save transaction to Supabase
    await saveTransaction(orderId, amount, orderInfo, patientId, services);
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderId,
          paymentUrl,
          amount,
          amountInCents: amount * 100,
          orderInfo,
          createDate,
          expireDate,
          expiresIn: "15 minutes",
          currency: config.vnp_CurrCode,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    await logMessage({
      error: "Failed to generate payment URL",
      details: error.message,
    });
    console.error("Error generating payment URL:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to generate payment URL",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});

// curl -X POST "http://127.0.0.1:54321/functions/v1/test" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" -H "Content-Type: application/json" -d '{"amount":"150000","orderInfo":"Payment for order #12345","patientId":"dfc1b883-47f7-40db-91ee-16424e212b37","services":["Consultation"]}'

// supabase secrets set VNPAY_HASH_SECRET="AN0RNCIIMYZSJTHU47SJQJWL8IULFP80" VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html" VNPAY_RETURN_URL="http://localhost:4200/payment-result"

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/test' --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' --header 'Content-Type: application/json' --data '{"amount":"150000","orderInfo":"Payment for order #12345","patientId":"dfc1b883-47f7-40db-91ee-16424e212b37","services":["Consultation"]}'

*/
