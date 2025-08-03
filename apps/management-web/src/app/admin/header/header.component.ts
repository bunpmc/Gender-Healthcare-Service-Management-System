import { CommonModule } from '@angular/common';
import { Component, inject, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  private router = inject(Router);
  private logger = inject(LoggerService);

  showProfileMenu: boolean = false;
  adminName: string = 'Administrator';

  ngOnInit() {
    // Get admin name from localStorage
    const userName = localStorage.getItem('user_name');
    if (userName) {
      this.adminName = userName;
    }
    this.logger.info('Admin header initialized', { adminName: this.adminName });
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.profile-dropdown') || target.closest('.profile-btn');

    if (!clickedInside) {
      this.showProfileMenu = false;
    }
  }

  toggleProfileMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showProfileMenu = !this.showProfileMenu;
    this.logger.debug('Profile menu toggled', { isOpen: this.showProfileMenu });
  }

  async logout(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    this.logger.info('🚪 Admin logout initiated');

    try {
      // Clear all admin session data
      localStorage.removeItem('role');
      localStorage.removeItem('staff_id');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_email');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      this.logger.info('✅ Session data cleared, redirecting to login');

      // Close profile menu
      this.showProfileMenu = false;

      // Redirect to login
      const success = await this.router.navigate(['/login']);
      if (success) {
        this.logger.info('✅ Successfully redirected to login page');
      } else {
        this.logger.warn('❌ Router navigation failed, using fallback');
        window.location.href = '/login';
      }
    } catch (error) {
      this.logger.error('❌ Error during logout', error);
      // Fallback navigation
      window.location.href = '/login';
    }
  }
}
