import { Component, inject, OnInit } from '@angular/core';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeaderComponent } from '../../components/header/header.component';
import { ContactMessage } from '../../models/user.model';
import { FormsModule, NgForm } from '@angular/forms';
import { environment } from '../../environments/environment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { createClient } from '@supabase/supabase-js';

@Component({
  selector: 'app-consultation-page',
  imports: [FooterComponent, HeaderComponent, FormsModule, TranslateModule],
  templateUrl: './consultation-page.component.html',
  styleUrl: './consultation-page.component.css',
})
export class ConsultationPageComponent implements OnInit {
  isSubmitting = false;
  formSubmitted = false;
  errorMsg = '';
  RememberContact = false;

  // Bind cho form
  contactData: Partial<ContactMessage> = {};

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );
  private translate = inject(TranslateService);

  ngOnInit() {
    // 1. Nếu có Remember-contact-form thì lấy tất cả data đã lưu
    const saved = localStorage.getItem('Remember-contact-form');
    if (saved) {
      this.contactData = JSON.parse(saved);
      this.RememberContact = true;
    }

    // 2. Nếu có pre-fill-message thì overwrite field message
    const prefill = localStorage.getItem('pre-fill-message');
    if (prefill) {
      this.contactData.message = prefill;
      localStorage.removeItem('pre-fill-message');
    }
  }

  onFieldInput(form: NgForm) {
    if (this.RememberContact) {
      localStorage.setItem('Remember-contact-form', JSON.stringify(form.value));
    }
  }

  markAllAsTouched(form: NgForm) {
    Object.values(form.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  async onContactSubmit(form: NgForm) {
    this.formSubmitted = true;
    this.errorMsg = '';
    if (form.invalid || this.isSubmitting) {
      this.markAllAsTouched(form);
      return;
    }
    this.isSubmitting = true;

    const contactData = { ...form.value };

    try {
      // Call the create_ticket function
      const { data, error } = await this.supabase.rpc('create_ticket', {
        p_message: contactData.message,
        // patient_id and schedule are null since they're not in the form
        p_patient_id: null,
        p_schedule: null,
      });

      if (error) {
        throw error;
      }

      const successMessage = this.translate.instant(
        'CONSULTATION.SUCCESS.MESSAGE_SENT'
      );
      alert(successMessage);
      if (this.RememberContact) {
        localStorage.setItem(
          'Remember-contact-form',
          JSON.stringify(contactData)
        );
      } else {
        localStorage.removeItem('Remember-contact-form');
      }
      form.resetForm();
      this.formSubmitted = false;
      this.isSubmitting = false;
      this.contactData = {};
    } catch (err: any) {
      const errorPrefix = this.translate.instant(
        'CONSULTATION.ERRORS.SEND_FAILED'
      );
      this.errorMsg = errorPrefix + ' ' + (err.message || '');
      alert(this.errorMsg);
      this.isSubmitting = false;
    }
  }
}
