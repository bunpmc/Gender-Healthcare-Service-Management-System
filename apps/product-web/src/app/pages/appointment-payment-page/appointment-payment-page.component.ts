import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { VnpayService } from '../../services/vnpay.service';
import {
  AppointmentPaymentData,
  AppointmentPaymentRequest,
  VNPayPaymentRequest,
} from '../../models/payment.model';

@Component({
  selector: 'app-appointment-payment',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './appointment-payment-page.component.html',
  styleUrls: ['./appointment-payment-page.component.scss'],
})
export class AppointmentPaymentPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private vnpayService = inject(VnpayService);
  private destroy$ = new Subject<void>();

  appointmentData: AppointmentPaymentData | null = null;
  isProcessing = false;
  errorMessage = '';
  currentLang = 'vi';

  ngOnInit(): void {
    console.log('🎯 Appointment Payment Page - Starting initialization');

    // Initialize language
    this.currentLang = localStorage.getItem('lang') || 'vi';
    this.translate.use(this.currentLang);

    // Get appointment payment data from sessionStorage
    const storedData = sessionStorage.getItem('appointmentPaymentData');
    if (!storedData) {
      console.log(
        '❌ No appointment payment data found, redirecting to appointment page'
      );
      this.router.navigate(['/appointment']);
      return;
    }

    try {
      this.appointmentData = JSON.parse(storedData);
      console.log(
        '📋 Retrieved appointment payment data:',
        this.appointmentData
      );
    } catch (error) {
      console.error('❌ Error parsing appointment payment data:', error);
      this.router.navigate(['/appointment']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeLang(lang: string): void {
    if (this.currentLang !== lang) {
      this.currentLang = lang;
      this.translate.use(lang);
      localStorage.setItem('lang', lang);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatTime(timeString: string): string {
    return timeString.substring(0, 5); // Remove seconds from HH:MM:SS
  }

  generateOrderId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `APPT-${timestamp}-${randomSuffix}`;
  }

  processPayment(): void {
    if (!this.appointmentData) {
      this.errorMessage = 'Không tìm thấy thông tin đặt lịch hẹn';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    const orderId = this.generateOrderId();
    console.log('Generated Order ID for appointment payment:', orderId);

    const paymentRequest: AppointmentPaymentRequest = {
      amount: this.appointmentData.payment_amount,
      orderInfo: `Thanh toán lịch hẹn - ${this.appointmentData.doctor_name} - ${this.appointmentData.appointment_date} ${this.appointmentData.appointment_time}`,
      patientId:
        JSON.parse(localStorage.getItem('current_user') || '{}')?.id,
      orderId: orderId,
      appointment_data: this.appointmentData.appointment_data,
      doctor_name: this.appointmentData.doctor_name,
      service_name: this.appointmentData.service_name,
    };

    console.log('Creating appointment payment with request:', paymentRequest);

    this.vnpayService
      .createPayment(paymentRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data?.paymentUrl) {
            console.log(
              'Payment URL created for appointment order:',
              response.data.orderId
            );
            // Redirect to VNPay
            window.location.href = response.data.paymentUrl;
          } else {
            this.errorMessage =
              response.error || 'Không thể tạo liên kết thanh toán';
            this.isProcessing = false;
          }
        },
        error: (error: any) => {
          console.error('Appointment payment creation error:', error);
          this.errorMessage =
            'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.';
          this.isProcessing = false;
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/appointment']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
