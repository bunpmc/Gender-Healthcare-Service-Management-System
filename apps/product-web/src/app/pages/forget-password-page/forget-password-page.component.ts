import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NgForm, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  templateUrl: './forget-password-page.component.html',
  styleUrl: './forget-password-page.component.css',
})
export class ForgotPasswordComponent {
  @Output() close = new EventEmitter<void>();

  step = signal(1); // 1: nhập sđt + email, 2: nhập otp + mk mới, 3: done
  phone = signal('');
  email = signal('');
  otp = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  isLoading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  // Gửi OTP
  onSubmitPhone(form: NgForm) {
    if (this.isLoading()) return;
    this.errorMsg.set('');
    this.successMsg.set('');
    if (!form.valid) return;

    // Validate both phone and email are provided
    if (!this.phone() || !this.email()) {
      this.errorMsg.set('Vui lòng nhập đầy đủ số điện thoại và email');
      return;
    }

    this.isLoading.set(true);
    // Use phone for OTP but email is for verification only
    this.authService.forgotPassword(this.phone()).subscribe({
      next: () => {
        this.successMsg.set(
          `Mã OTP đã được gửi đến số điện thoại ${this.phone()}. Email ${this.email()} sẽ được sử dụng để xác thực.`
        );
        this.step.set(2);
      },
      error: (err: any) => {
        const errorMsg =
          err?.error?.message || 'Gửi OTP thất bại. Vui lòng thử lại.';
        this.errorMsg.set(errorMsg);
      },
      complete: () => this.isLoading.set(false),
    });
  }

  // Đặt lại mật khẩu
  onSubmitReset(form: NgForm) {
    if (this.isLoading()) return;
    this.errorMsg.set('');
    this.successMsg.set('');
    if (!form.valid) return;
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMsg.set('Mật khẩu xác nhận không khớp');
      return;
    }
    this.isLoading.set(true);
    this.authService
      .resetPassword(this.phone(), this.otp(), this.newPassword())
      .subscribe({
        next: () => {
          this.successMsg.set(
            'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.'
          );
          this.step.set(3);
        },
        error: (err: any) => {
          const errorMsg =
            err?.error?.message ||
            'Mã OTP không hợp lệ hoặc mật khẩu không đúng định dạng';
          this.errorMsg.set(errorMsg);
        },
        complete: () => this.isLoading.set(false),
      });
  }
}
