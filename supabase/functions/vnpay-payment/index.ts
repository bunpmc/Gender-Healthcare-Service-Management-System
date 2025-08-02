import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv/load.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
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
// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hour}${minute}${second}`;
}
function sortObjectByKey(obj) {
  const sorted = Object.keys(obj).sort().reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
  return new URLSearchParams(sorted).toString();
}
async function generateVNPaySignature(params, secretKey) {
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
function getClientIP(req) {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  const xRealIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  return xForwardedFor && xForwardedFor.split(",")[0].trim() || xRealIP ||
    cfConnectingIP || "127.0.0.1";
}
async function logMessage(message) {
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
  orderId,
  amount,
  orderInfo,
  patientId,
  services,
) {
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
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Use POST method",
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
  let body;
  try {
    body = await req.json();
  } catch {
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
  const amount = Number(body.amount);
  const orderInfo = body.orderInfo || "Payment from Edge Function";
  const patientId = body.patientId;
  const services = body.services || null;
  if (!amount || amount <= 0) {
    await logMessage({
      error: "Invalid amount",
      amount,
      request: body,
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid amount",
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
    Math.random().toString(36).substr(2, 9).toUpperCase()
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

// curl -X POST "https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/vnpay-payment" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eHhvZHhwbHlldGVjcnNieG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTE2MjAsImV4cCI6MjA2NTE4NzYyMH0.O60A63ihSaQ_2qbLozpU04yy7ZB5h8BUZqEvWWCLnf0"-H "Content-Type: application/json" -d '{"amount":"150000","orderInfo":"Payment for order #12345","patientId":"dfc1b883-47f7-40db-91ee-16424e212b37","services":["Consultation"]}'

// supabase secrets set VNPAY_HASH_SECRET="AN0RNCIIMYZSJTHU47SJQJWL8IULFP80" VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html" VNPAY_RETURN_URL="http://localhost:4200/payment-result"
