import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BookingService } from '../../services/booking.service';
import { AppointmentCreateRequest } from '../../models/booking.model';
import { VnpayService } from '../../services/vnpay.service';
import { PaymentResult } from '../../models/payment.model';
import { lastValueFrom } from 'rxjs';

interface AppointmentResult {
  success: boolean;
  message: string;
  appointmentData?: AppointmentCreateRequest;
  bookingDetails?: {
    appointment_date: string;
    appointment_time: string;
    doctor_id: string;
    service_id?: string;
    appointment_status: string;
  };
  responseData?: {
    appointment?: {
      appointment_id?: string;
      guest_appointment_id?: string;
      appointment_date: string;
      appointment_time: string;
      doctor_id: string;
      appointment_status: string;
    };
    slot_info?: {
      doctor_slot_id: string;
      slot_date: string;
      slot_time: string;
    };
  };
  errorDetails?: string;
  httpError?: {
    status: number;
    statusText: string;
    details: any;
  };
  paymentInfo?: {
    orderId?: string;
    amount?: number;
    status?: string;
  };
}

@Component({
  selector: 'app-appointment-result',
  standalone: true,
  imports: [CommonModule, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './appointment-result-page.component.html',
  styleUrl: './appointment-result-page.component.css',
})
export class AppointmentResultComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private bookingService = inject(BookingService);
  private vnpayService = inject(VnpayService);

  result: AppointmentResult | null = null;
  isLoading = true;
  isProcessing = false;

  ngOnInit(): void {
    // Check for VNPay callback parameters in the URL
    this.route.queryParams.subscribe(async (queryParams) => {
      if (queryParams['vnp_TxnRef'] && queryParams['vnp_ResponseCode']) {
        await this.verifyPayment(queryParams);
      } else {
        // Fallback to stored appointment result if no VNPay callback params
        const storedResult = sessionStorage.getItem('appointmentResult');
        if (!storedResult) {
          console.log('No appointment data found, redirecting to appointment page');
          this.router.navigate(['/appointment']);
          return;
        }

        try {
          const appointmentData = JSON.parse(storedResult);
          console.log('Retrieved appointment data:', appointmentData);

          if (appointmentData.success === true) {
            this.result = appointmentData;
            this.isLoading = false;
            sessionStorage.removeItem('appointmentResult');
            console.log('DISPLAYING SUCCESS RESULT TO USER:', this.result?.message);
            return;
          }

          if (appointmentData.appointmentData) {
            this.processAppointment(appointmentData);
          } else {
            this.result = {
              success: false,
              message: 'Invalid appointment data received',
              errorDetails: 'The appointment data structure is invalid. Please try booking again.',
            };
            this.isLoading = false;
            sessionStorage.removeItem('appointmentResult');
          }
        } catch (error) {
          console.error('Error parsing appointment data:', error);
          this.result = {
            success: false,
            message: 'Error processing appointment data',
            errorDetails: 'Failed to parse appointment information. Please try booking again.',
          };
          this.isLoading = false;
          sessionStorage.removeItem('appointmentResult');
        }
      }
    });
  }

  private async verifyPayment(queryParams: { [key: string]: any }): Promise<void> {
    this.isLoading = true;
    try {
      console.log('Verifying VNPay transaction with query params:', queryParams);

      // Verify the transaction using VnpayService
      const paymentResult = await lastValueFrom(this.vnpayService.verifyCallbackFromParams(queryParams));

      if (!paymentResult) {
        throw new Error('Payment verification returned no result');
      }

      console.log('Payment verification result:', paymentResult);

      const isSuccess = paymentResult.success && this.vnpayService.isPaymentSuccessful(
        paymentResult.payment_details?.vnp_ResponseCode || ''
      );
      const orderId = queryParams['vnp_TxnRef'];
      const status = isSuccess ? 'completed' : 'failed';

      // Transaction status is updated internally by verifyCallbackFromParams
      console.log(`Transaction status updated to ${status} by VNPay callback`);

      // Retrieve stored appointment data
      const storedResult = sessionStorage.getItem('appointmentResult');
      let appointmentData = storedResult ? JSON.parse(storedResult) : null;

      if (appointmentData) {
        // Update paymentInfo in appointmentData
        appointmentData.paymentInfo = {
          ...appointmentData.paymentInfo,
          orderId,
          status,
          amount: parseInt(queryParams['vnp_Amount']) / 100, // VNPay amount is in smallest unit (VND * 100)
        };

        if (isSuccess) {
          // Proceed with appointment creation if payment is successful
          this.processAppointment(appointmentData);
        } else {
          // Handle failed payment
          this.result = {
            success: false,
            message: paymentResult.message || this.vnpayService.getPaymentStatusMessage(
              paymentResult.payment_details?.vnp_ResponseCode || 'unknown'
            ),
            appointmentData: appointmentData.appointmentData,
            bookingDetails: appointmentData.bookingDetails,
            errorDetails: 'Payment verification failed. Please try again or contact support.',
            paymentInfo: appointmentData.paymentInfo,
          };
          this.isLoading = false;
          sessionStorage.removeItem('appointmentResult');
        }
      } else {
        this.result = {
          success: false,
          message: 'No appointment data found',
          errorDetails: 'No appointment data associated with this payment. Please try booking again.',
          paymentInfo: { orderId, status },
        };
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      this.result = {
        success: false,
        message: 'Payment verification error',
        errorDetails: 'Failed to verify payment status. Please try again or contact support.',
        paymentInfo: { orderId: queryParams['vnp_TxnRef'], status: 'failed' },
      };
      this.isLoading = false;
    }
  }

  private processAppointment(appointmentData: any): void {
    console.log('Processing appointment creation...');
    this.isProcessing = true;
    this.isLoading = true;

    this.bookingService
      .createAppointment(appointmentData.appointmentData)
      .subscribe({
        next: (response) => {
          console.log('Appointment creation response:', response);

          if (response.success) {
            this.result = {
              success: true,
              message: response.message || 'Appointment created successfully!',
              appointmentData: appointmentData.appointmentData,
              bookingDetails: appointmentData.bookingDetails,
              responseData: {
                appointment: response.appointment_details || {
                  appointment_id: response.appointment_id,
                  guest_appointment_id: response.guest_appointment_id,
                  appointment_date: appointmentData.bookingDetails?.appointment_date,
                  appointment_time: appointmentData.bookingDetails?.appointment_time,
                  doctor_id: appointmentData.bookingDetails?.doctor_id,
                  appointment_status: 'confirmed',
                },
              },
              paymentInfo: appointmentData.paymentInfo || null,
            };

            this.handleSuccessfulAppointment(response, appointmentData);
            console.log('Appointment created successfully');

            localStorage.removeItem('appointmentProfileChoice');
            console.log('Cleared appointment profile choice from localStorage');
          } else {
            this.handleFailedAppointment(response, appointmentData);
          }

          this.isLoading = false;
          this.isProcessing = false;
          sessionStorage.removeItem('appointmentResult');
        },
        error: (error) => {
          this.handleAppointmentError(error, appointmentData);
          this.isLoading = false;
          this.isProcessing = false;
          sessionStorage.removeItem('appointmentResult');
        },
      });
  }

  private async handleSuccessfulAppointment(response: any, appointmentData: any): Promise<void> {
    const paymentInfo = appointmentData.paymentInfo;

    if (paymentInfo?.orderId) {
      try {
        console.log('Ensuring payment status is consistent for successful appointment...');

        // Transaction status is already updated in verifyPayment
        console.log('Payment transaction already updated as completed');

        if (this.result) {
          this.result.paymentInfo = {
            ...paymentInfo,
            status: 'completed',
          };
        }
      } catch (error) {
        console.error('Failed to process payment transaction:', error);
      }
    }
  }

  private async handleFailedAppointment(response: any, appointmentData: any): Promise<void> {
    this.result = {
      success: false,
      message: response.message || 'Failed to create appointment',
      appointmentData: appointmentData.appointmentData,
      bookingDetails: appointmentData.bookingDetails,
      errorDetails: response.message || 'The appointment could not be created. Please try again or contact support.',
      paymentInfo: appointmentData.paymentInfo || null,
    };

    console.log('Appointment creation failed:', response.message);
  }

  private async handleAppointmentError(error: any, appointmentData: any): Promise<void> {
    console.error('Error creating appointment:', error);

    let errorMessage = 'Failed to create appointment';
    let errorDetails = 'Network error occurred. Please check your connection and try again.';

    if (error.status === 400 && error.error) {
      if (error.error.error) {
        errorMessage = 'Appointment booking failed';
        errorDetails = error.error.error;
        console.log('Business logic error details:', error.error.details);
      } else if (error.error.message) {
        errorMessage = 'Appointment booking failed';
        errorDetails = error.error.message;
      }
    } else if (error.message) {
      errorDetails = error.message;
    }

    this.result = {
      success: false,
      message: errorMessage,
      appointmentData: appointmentData.appointmentData,
      bookingDetails: appointmentData.bookingDetails,
      errorDetails: errorDetails,
      httpError: {
        status: error.status,
        statusText: error.statusText,
        details: error.error?.details || null,
      },
      paymentInfo: appointmentData.paymentInfo || null,
    };

    console.log('Final error result for display:', this.result);
    console.log('USER WILL SEE - Main Error Message:', this.result?.message);
    console.log('USER WILL SEE - Error Details:', this.result?.errorDetails);
    if (this.result?.httpError?.details) {
      console.log('Additional Error Details Available:', this.result.httpError.details);
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToAppointment(): void {
    this.router.navigate(['/appointment']);
  }

  goToPaymentHistory(): void {
    if (this.result?.paymentInfo?.orderId) {
      this.router.navigate(['/payment-history'], {
        queryParams: { orderId: this.result.paymentInfo.orderId },
      });
    }
  }

  formatSchedule(schedule: string): string {
    const scheduleMap: { [key: string]: string } = {
      Morning: this.translate.instant('APPOINTMENT.SCHEDULE.MORNING'),
      Afternoon: this.translate.instant('APPOINTMENT.SCHEDULE.AFTERNOON'),
      Evening: this.translate.instant('APPOINTMENT.SCHEDULE.EVENING'),
    };
    return scheduleMap[schedule] || schedule;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  }

  getAppointmentId(): string {
    if (!this.result?.responseData?.appointment) return '';
    return (
      this.result.responseData.appointment.appointment_id ||
      this.result.responseData.appointment.guest_appointment_id ||
      ''
    );
  }

  getPaymentStatus(): string {
    if (!this.result?.paymentInfo?.status) return '';

    const statusMap: { [key: string]: string } = {
      completed: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
      pending: 'Đang chờ thanh toán',
      cancelled: 'Đã hủy',
    };

    return statusMap[this.result.paymentInfo.status] || this.result.paymentInfo.status;
  }

  formatAmount(amount: number): string {
    if (!amount) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  hasPaymentInfo(): boolean {
    return !!(this.result?.paymentInfo?.orderId);
  }
}