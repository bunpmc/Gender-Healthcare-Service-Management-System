import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  VNPayPaymentRequest,
  VNPayPaymentResponse,
  VNPayCallbackData,
  PaymentTransaction,
  PaymentResult,
} from '../models/payment.model';

/**
 * Enhanced VNPay Service for handling VNPay payment integration
 *
 * Usage Examples:
 *
 * 1. In a Payment Result Component (handling VNPay callback):
 * ```typescript
 * export class PaymentResultComponent implements OnInit {
 *   constructor(
 *     private route: ActivatedRoute,
 *     private vnpayService: VnpayService
 *   ) {}
 *
 *   ngOnInit(): void {
 *     this.route.queryParams.subscribe(params => {
 *       // Method 1: Use the convenience method
 *       this.vnpayService.verifyCallbackFromParams(params).subscribe({
 *         next: (result) => console.log('Payment result:', result),
 *         error: (error) => console.error('Payment error:', error)
 *       });
 *
 *       // Method 2: Parse manually then verify
 *       const callbackData = this.vnpayService.parseCallbackFromQueryParams(params);
 *       if (callbackData) {
 *         this.vnpayService.verifyCallback(callbackData).subscribe(...);
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * 2. For direct URL parsing:
 * ```typescript
 * const callbackUrl = 'https://yourapp.com/payment-result?vnp_Amount=100000&vnp_TxnRef=ORDER123...';
 * this.vnpayService.verifyCallbackFromUrl(callbackUrl).subscribe(...);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class VnpayService {
  private readonly vnpayPaymentUrl =
    'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/vnpay-payment';
  private readonly vnpayCallbackUrl =
    'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/vnpay-callback';
  private readonly vnp_TmnCode = '4Q0AGO8S'; // Must match vnpay-callback and vnpay-payment config

  constructor(private http: HttpClient) {}

  // Get HTTP headers
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  // Create VNPay payment URL
  createPayment(
    paymentRequest: VNPayPaymentRequest
  ): Observable<VNPayPaymentResponse> {
    const payload = {
      amount: this.formatAmountForVNPay(paymentRequest.amount), // Format amount for VNPay
      orderInfo: paymentRequest.orderInfo,
      patientId: paymentRequest.patientId,
      services: paymentRequest.services,
    };

    console.log('Creating payment with payload:', payload); // Log payload for debugging

    return this.http.post<VNPayPaymentResponse>(this.vnpayPaymentUrl, payload, {
      headers: this.getHeaders(),
    });
  }

  // Verify VNPay callback - Enhanced version with URL parsing support
  verifyCallback(callbackData: VNPayCallbackData): Observable<PaymentResult> {
    console.log('Callback data sent to edge function:', callbackData);

    // Validate required parameters
    if (!this.validateCallbackData(callbackData)) {
      throw new Error(
        'Invalid VNPay callback data: Missing or invalid required parameters'
      );
    }

    // Ensure we're sending all required VNPay parameters
    const payload = {
      vnp_Amount: callbackData.vnp_Amount,
      vnp_BankCode: callbackData.vnp_BankCode,
      vnp_BankTranNo: callbackData.vnp_BankTranNo,
      vnp_CardType: callbackData.vnp_CardType,
      vnp_OrderInfo: callbackData.vnp_OrderInfo,
      vnp_PayDate: callbackData.vnp_PayDate,
      vnp_ResponseCode: callbackData.vnp_ResponseCode,
      vnp_TmnCode: callbackData.vnp_TmnCode,
      vnp_TransactionNo: callbackData.vnp_TransactionNo,
      vnp_TransactionStatus: callbackData.vnp_TransactionStatus,
      vnp_TxnRef: callbackData.vnp_TxnRef,
      vnp_SecureHash: callbackData.vnp_SecureHash,
    };

    console.log('Payload being sent to VNPay callback edge function:', payload);

    return this.http.post<PaymentResult>(this.vnpayCallbackUrl, payload, {
      headers: this.getHeaders(),
    });
  }

  // Verify VNPay callback from URL - Convenience method for direct URL parsing
  verifyCallbackFromUrl(callbackUrl: string): Observable<PaymentResult> {
    const callbackData = this.parseCallbackParams(callbackUrl);
    if (!callbackData) {
      throw new Error('Failed to parse VNPay callback URL parameters');
    }
    return this.verifyCallback(callbackData);
  }

  // Verify VNPay callback from query parameters - For Angular Router usage
  verifyCallbackFromParams(queryParams: {
    [key: string]: any;
  }): Observable<PaymentResult> {
    const callbackData = this.parseCallbackFromQueryParams(queryParams);
    if (!callbackData) {
      throw new Error('Failed to parse VNPay callback query parameters');
    }
    return this.verifyCallback(callbackData);
  }

  // Get transaction by ID
  getTransaction(transactionId: string): Observable<PaymentTransaction> {
    return this.http.get<PaymentTransaction>(
      `${environment.apiEndpoint}/get-transaction/${transactionId}`,
      { headers: this.getHeaders() }
    );
  }

  // Get user transactions
  getUserTransactions(userId: string): Observable<PaymentTransaction[]> {
    return this.http.get<PaymentTransaction[]>(
      `${environment.apiEndpoint}/get-user-transactions/${userId}`,
      { headers: this.getHeaders() }
    );
  }

  // Generate return URL for VNPay
  generateReturnUrl(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/payment-result`;
  }

  // Get client IP (simplified version)
  private getClientIP(): string {
    // In a real application, you might want to get the actual client IP
    // For now, return a default value
    return '127.0.0.1';
  }

  // Format amount for VNPay (VNPay requires amount in VND without decimal)
  formatAmountForVNPay(amount: number): number {
    // VNPay expects amount in VND without decimals (amount is already in VND)
    return Math.round(amount);
  }

  // Validate VNPay callback data
  private validateCallbackData(callbackData: VNPayCallbackData): boolean {
    const requiredFields = [
      'vnp_Amount',
      'vnp_ResponseCode',
      'vnp_TxnRef',
      'vnp_SecureHash',
      'vnp_TmnCode',
    ];

    for (const field of requiredFields) {
      if (!callbackData[field as keyof VNPayCallbackData]) {
        console.error(`Missing required VNPay parameter: ${field}`);
        return false;
      }
    }

    // Validate vnp_TmnCode matches expected value
    if (callbackData.vnp_TmnCode !== this.vnp_TmnCode) {
      console.error(
        `Invalid vnp_TmnCode: expected ${this.vnp_TmnCode}, received ${callbackData.vnp_TmnCode}`
      );
      return false;
    }

    return true;
  }

  // Parse VNPay callback from Angular Router query parameters
  parseCallbackFromQueryParams(queryParams: {
    [key: string]: any;
  }): VNPayCallbackData | null {
    try {
      const callbackData: VNPayCallbackData = {
        vnp_Amount: queryParams['vnp_Amount'] || '',
        vnp_BankCode: queryParams['vnp_BankCode'] || '',
        vnp_BankTranNo: queryParams['vnp_BankTranNo'] || '',
        vnp_CardType: queryParams['vnp_CardType'] || '',
        vnp_OrderInfo: queryParams['vnp_OrderInfo'] || '',
        vnp_PayDate: queryParams['vnp_PayDate'] || '',
        vnp_ResponseCode: queryParams['vnp_ResponseCode'] || '',
        vnp_TmnCode: queryParams['vnp_TmnCode'] || '',
        vnp_TransactionNo: queryParams['vnp_TransactionNo'] || '',
        vnp_TransactionStatus: queryParams['vnp_TransactionStatus'] || '',
        vnp_TxnRef: queryParams['vnp_TxnRef'] || '',
        vnp_SecureHash: queryParams['vnp_SecureHash'] || '',
      };

      console.log('Parsed callback data from query parameters:', callbackData);

      // Log missing critical parameters for debugging
      if (!callbackData.vnp_TxnRef) {
        console.warn('No vnp_TxnRef found in callback query parameters');
      }
      if (!callbackData.vnp_SecureHash) {
        console.warn('No vnp_SecureHash found in callback query parameters');
      }
      if (!callbackData.vnp_TmnCode) {
        console.warn('No vnp_TmnCode found in callback query parameters');
      } else if (callbackData.vnp_TmnCode !== this.vnp_TmnCode) {
        console.warn(
          `Invalid vnp_TmnCode: expected ${this.vnp_TmnCode}, received ${callbackData.vnp_TmnCode}`
        );
      }

      return callbackData;
    } catch (error) {
      console.error('Error parsing VNPay callback query parameters:', error);
      return null;
    }
  }

  // Parse VNPay callback URL parameters (Enhanced version)
  parseCallbackParams(url: string): VNPayCallbackData | null {
    try {
      const urlParams = new URLSearchParams(url.split('?')[1]);

      const callbackData: VNPayCallbackData = {
        vnp_Amount: urlParams.get('vnp_Amount') || '',
        vnp_BankCode: urlParams.get('vnp_BankCode') || '',
        vnp_BankTranNo: urlParams.get('vnp_BankTranNo') || '',
        vnp_CardType: urlParams.get('vnp_CardType') || '',
        vnp_OrderInfo: urlParams.get('vnp_OrderInfo') || '',
        vnp_PayDate: urlParams.get('vnp_PayDate') || '',
        vnp_ResponseCode: urlParams.get('vnp_ResponseCode') || '',
        vnp_TmnCode: urlParams.get('vnp_TmnCode') || '',
        vnp_TransactionNo: urlParams.get('vnp_TransactionNo') || '',
        vnp_TransactionStatus: urlParams.get('vnp_TransactionStatus') || '',
        vnp_TxnRef: urlParams.get('vnp_TxnRef') || '',
        vnp_SecureHash: urlParams.get('vnp_SecureHash') || '',
      };

      console.log('Parsed callback data from URL:', callbackData);

      // Log missing critical parameters for debugging
      if (!callbackData.vnp_TxnRef) {
        console.warn('No vnp_TxnRef found in callback URL parameters');
      }
      if (!callbackData.vnp_SecureHash) {
        console.warn('No vnp_SecureHash found in callback URL parameters');
      }
      if (!callbackData.vnp_TmnCode) {
        console.warn('No vnp_TmnCode found in callback URL parameters');
      } else if (callbackData.vnp_TmnCode !== this.vnp_TmnCode) {
        console.warn(
          `Invalid vnp_TmnCode: expected ${this.vnp_TmnCode}, received ${callbackData.vnp_TmnCode}`
        );
      }

      return callbackData;
    } catch (error) {
      console.error('Error parsing VNPay callback parameters:', error);
      return null;
    }
  }

  // Check if payment was successful based on response code
  isPaymentSuccessful(responseCode: string): boolean {
    return responseCode === '00';
  }

  // Get payment status message
  getPaymentStatusMessage(responseCode: string): string {
    const statusMessages: { [key: string]: string } = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
    };

    return (
      statusMessages[responseCode] ||
      'Giao dịch không thành công do lỗi không xác định.'
    );
  }
}
