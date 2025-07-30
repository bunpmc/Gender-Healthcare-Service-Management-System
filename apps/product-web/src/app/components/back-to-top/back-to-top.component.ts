import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './back-to-top.component.html',
  styleUrl: './back-to-top.component.css',
})
export class BackToTopComponent {
  isVisible = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Show button when user scrolls down 300px
    this.isVisible.set(window.pageYOffset > 300);
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
