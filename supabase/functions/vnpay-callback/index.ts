import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
function sortObjectByKey(obj: Record<string, string>) {
  const sorted = Object.keys(obj).sort().reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
  return new URLSearchParams(sorted).toString();
}
async function generateVNPaySignature(
  params: Record<string, string>,
  secretKey: string,
) {
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
async function logMessage(message: any) {
  try {
    const { error } = await supabase.from("logs").insert({
      message,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Error logging message:", error);
  }
}
async function updateTransactionStatus(
  txnRef: string,
  status: string,
  vnpayData: any = null,
) {
  try {
    // Check if the transaction exists
    const { data: existingTransaction, error: fetchError } = await supabase
      .from("transactions").select("id, status, order_id").eq(
        "order_id",
        txnRef,
      ).single();
    if (fetchError) {
      console.error("Error fetching transaction:", fetchError);
      await logMessage({
        error: "Transaction not found",
        txnRef,
        fetchError: fetchError.message,
      });
      return false;
    }
    if (!existingTransaction) {
      console.error("Transaction not found for order_id:", txnRef);
      await logMessage({
        error: "Transaction not found",
        txnRef,
      });
      return false;
    }
    await logMessage({
      type: "transaction_found",
      txnRef,
      currentStatus: existingTransaction.status,
      newStatus: status,
    });
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("transactions").update(
      updateData,
    ).eq("order_id", txnRef).select();
    if (error) {
      console.error("Error updating transaction:", error);
      await logMessage({
        error: "Database update failed",
        txnRef,
        updateError: error.message,
      });
      throw error;
    }
    await logMessage({
      type: "transaction_updated",
      txnRef,
      status,
      updatedRecord: data[0],
    });
    return true;
  } catch (error) {
    console.error("Error updating transaction:", error);
    await logMessage({
      error: "Update transaction failed",
      txnRef,
      status,
      errorMessage: error.message,
    });
    return false;
  }
}
async function updatePendingTransactionToSuccess(
  txnRef: string,
  vnpayData: any,
) {
  try {
    const { data, error } = await supabase.from("transactions").update({
      status: "success",
      updated_at: new Date().toISOString(),
      vnpay_response: vnpayData,
      payment_date: vnpayData.vnp_PayDate,
      transaction_no: vnpayData.vnp_TransactionNo,
      bank_code: vnpayData.vnp_BankCode,
    }).eq("order_id", txnRef).eq("status", "pending").select();
    if (error) {
      console.error("Error updating pending transaction:", error);
      return false;
    }
    if (data.length === 0) {
      console.log("No pending transaction found for order_id:", txnRef);
      await logMessage({
        warning: "No pending transaction found",
        txnRef,
      });
      return false;
    }
    await logMessage({
      type: "pending_transaction_updated_to_success",
      txnRef,
      updatedRecord: data[0],
    });
    return true;
  } catch (error) {
    console.error("Error updating pending transaction:", error);
    return false;
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
        status: "error",
        message: "Method not allowed, use POST",
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
  let params;
  try {
    params = await req.json();
    await logMessage({
      type: "vnpay_callback",
      params,
      method: req.method,
      url: req.url,
    });
  } catch (error) {
    await logMessage({
      error: "Failed to parse JSON body",
      message: error.message,
    });
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Invalid JSON body",
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
  try {
    // Extract VNPay response parameters
    const {
      vnp_Amount,
      vnp_BankCode,
      vnp_BankTranNo,
      vnp_CardType,
      vnp_OrderInfo,
      vnp_PayDate,
      vnp_ResponseCode,
      vnp_TmnCode,
      vnp_TransactionNo,
      vnp_TransactionStatus,
      vnp_TxnRef,
      txnRef,
      vnp_SecureHash,
      ...otherParams
    } = params;
    // Use vnp_TxnRef if available, fallback to txnRef
    const transactionRef = vnp_TxnRef || txnRef;
    const amount = vnp_Amount ? parseInt(vnp_Amount) / 100 : 0;
    // Validate required parameters
    if (
      !transactionRef || !vnp_SecureHash || vnp_TmnCode !== config.vnp_TmnCode
    ) {
      await logMessage({
        error: "Missing or invalid required parameters",
        transactionRef: transactionRef || "undefined",
        hasSecureHash: !!vnp_SecureHash,
        hasVnpTxnRef: !!vnp_TxnRef,
        hasTxnRef: !!txnRef,
        hasValidTmnCode: vnp_TmnCode === config.vnp_TmnCode,
      });
      return new Response(
        JSON.stringify({
          status: "error",
          message:
            "Missing or invalid required parameters (transactionRef, secure hash, or TmnCode)",
          transactionRef: transactionRef || "undefined",
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
    // Prepare parameters for signature verification (exclude vnp_SecureHash)
    const signParams = {
      ...params,
    };
    delete signParams.vnp_SecureHash;
    // Generate signature for verification
    const signData = sortObjectByKey(signParams);
    const calculatedSignature = await generateVNPaySignature(
      signData,
      config.vnp_HashSecret,
    );
    // Verify signature
    if (calculatedSignature !== vnp_SecureHash) {
      await logMessage({
        error: "Invalid signature",
        transactionRef,
        expected: calculatedSignature,
        received: vnp_SecureHash,
      });
      await updateTransactionStatus(transactionRef, "signature_invalid");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Invalid signature",
          transactionRef,
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
    // Prepare VNPay data for storage
    const vnpayData = {
      vnp_Amount,
      vnp_BankCode,
      vnp_BankTranNo,
      vnp_CardType,
      vnp_OrderInfo,
      vnp_PayDate,
      vnp_ResponseCode,
      vnp_TmnCode,
      vnp_TransactionNo,
      vnp_TransactionStatus,
      vnp_TxnRef: transactionRef,
    };
    // Check payment status
    if (vnp_ResponseCode === "00" && vnp_TransactionStatus === "00") {
      // Payment successful - update status to 'success'
      await updatePendingTransactionToSuccess(transactionRef, vnpayData);
      await logMessage({
        type: "payment_success",
        transactionRef,
        amount,
        transactionNo: vnp_TransactionNo,
        bankCode: vnp_BankCode,
      });
      return new Response(
        JSON.stringify({
          status: "success",
          message: "Payment completed successfully",
          transactionRef,
          amount,
          transactionNo: vnp_TransactionNo,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    } else {
      // Payment failed
      await updateTransactionStatus(transactionRef, "failed", vnpayData);
      await logMessage({
        type: "payment_failed",
        transactionRef,
        responseCode: vnp_ResponseCode,
        transactionStatus: vnp_TransactionStatus,
      });
      const errorMessages = {
        "07":
          "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
        "09":
          "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
        "10":
          "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
        "11":
          "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
        "12":
          "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
        "13":
          "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).",
        "24": "Giao dịch không thành công do: Khách hàng hủy giao dịch",
        "51":
          "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
        "65":
          "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
        "75": "Ngân hàng thanh toán đang bảo trì.",
        "79":
          "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.",
        "99":
          "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
      };
      const errorMessage = errorMessages[vnp_ResponseCode] ||
        "Giao dịch không thành công do lỗi không xác định.";
      return new Response(
        JSON.stringify({
          status: "failed",
          message: errorMessage,
          transactionRef,
          responseCode: vnp_ResponseCode,
          transactionStatus: vnp_TransactionStatus,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }
  } catch (error) {
    await logMessage({
      error: "Callback processing error",
      message: error.message,
      stack: error.stack,
    });
    console.error("VNPay callback error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Internal server error occurred while processing payment",
        error: error.message,
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
