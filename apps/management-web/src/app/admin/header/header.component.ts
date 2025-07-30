import { CommonModule } from '@angular/common';
import { Component, inject, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  private router = inject(Router);

  showProfileMenu: boolean = false;
  adminName: string = 'Administrator';

  ngOnInit() {
    // Get admin name from localStorage
    const userName = localStorage.getItem('user_name');
    if (userName) {
      this.adminName = userName;
    }
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

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  async logout() {
    console.log('🚪 Admin logout initiated');

    // Clear all admin session data
    localStorage.removeItem('role');
    localStorage.removeItem('staff_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');

    console.log('✅ Session data cleared, redirecting to login');

    // Close profile menu
    this.showProfileMenu = false;

    // Redirect to login
    this.router.navigate(['/login']).then(success => {
      if (success) {
        console.log('✅ Successfully redirected to login page');
      } else {
        console.error('❌ Failed to redirect, using fallback');
        window.location.href = '/login';
      }
    });
  }
}
