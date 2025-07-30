import { NgClass } from '@angular/common';
import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core'; // THÊM
import { TokenService } from '../../services/token.service';
import { Cart } from '../../models/payment.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass, RouterLink, TranslateModule, CommonModule], // THÊM TranslateModule
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isSearch = false;
  isActive = false;
  isMenuOpen = false;
  isUserMenuOpen = false;
  isScrolled = false;
  user: any = null;
  currentLang = 'vi'; // Ngôn ngữ hiện tại
  cart: Cart = { items: [], total: 0, itemCount: 0 };

  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private translate = inject(TranslateService); // THÊM
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('lang') || 'vi';
    this.translate.use(this.currentLang);
    this.getUserInfo();

    // Subscribe to cart changes
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cart: Cart) => {
        console.log('🎯 Header cart update:', cart);
        this.cart = cart;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Get cart count directly from service
  getCartCount(): number {
    return this.cartService.getItemCount();
  }

  changeLang(lang: string) {
    if (this.currentLang !== lang) {
      this.currentLang = lang;
      this.translate.use(lang);
      localStorage.setItem('lang', lang);
    }
  }

  getUserInfo() {
    // Subscribe to current user changes for real-time updates
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.user = user;
        console.log(
          'Header: Current user updated:',
          user?.patient?.full_name || 'No name available'
        );
      },
      error: (err: any) => {
        console.error('Header: Error getting user info:', err);
        this.user = null;
      },
    });

    // Also try to get user profile from API as fallback
    this.authService.getUserProfile().subscribe({
      next: (data: any) => {
        if (!this.user && data) {
          this.user = data;
          console.log('Header: User profile from API:', data);
        }
      },
      error: (err: any) => {
        console.error('Header: Error getting user profile:', err);
      },
    });
  }

  logout() {
    // Use AuthService logout method to properly clear all data
    this.authService.logout();
    this.user = null;
    this.router.navigate(['/']); // Redirect to home page instead of login
  }

  isSearchHandle(val: boolean) {
    this.isSearch = val;
  }
  closeSearch() {
    this.isSearch = false;
  }
  openMenu() {
    this.isMenuOpen = true;
  }
  closeMenu() {
    this.isMenuOpen = false;
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  toggleHamburger() {
    this.isActive = !this.isActive;
  }

  // Helper method to get user's display name
  getUserDisplayName(): string {
    if (!this.user) return '';

    // Try different sources for the name
    if (this.user.patient?.full_name) {
      return this.user.patient.full_name;
    }

    // Check if user object has name property (from localStorage)
    if ((this.user as any).name) {
      return (this.user as any).name;
    }

    // Check if user object has full_name property
    if ((this.user as any).full_name) {
      return (this.user as any).full_name;
    }

    // Fallback to email
    return this.user.email || 'User';
  }

  // Helper method to get user's email
  getUserEmail(): string {
    if (!this.user) return '';

    return this.user.email || this.user.patient?.email || '';
  }

  // Helper method to get user's image
  getUserImage(): string {
    if (!this.user) return '';

    // Try different sources for the image
    if (this.user.patient?.image_link) {
      return this.user.patient.image_link;
    }

    // Check if user object has picture property (from Google OAuth)
    if ((this.user as any).picture) {
      return (this.user as any).picture;
    }

    return '';
  }
}
