import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-contact-support',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './contact-support.component.html',
  styleUrl: './contact-support.component.css'
})
export class ContactSupportComponent {
  // Fake phone numbers for demo
  phoneNumber = '+84 909 157 997';
  zaloNumber = '+84 909 157 997';

  onPhoneClick() {
    window.open(`tel:${this.phoneNumber}`, '_self');
  }

  onZaloClick() {
    // Zalo deep link format
    const zaloLink = `https://zalo.me/${this.zaloNumber.replace(/\s+/g, '').replace('+84', '0')}`;
    window.open(zaloLink, '_blank');
  }
}
