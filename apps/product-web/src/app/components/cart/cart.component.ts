import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { CartService } from '../../services/cart.service';
import { Cart, CartItem } from '../../models/payment.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart = { items: [], total: 0, itemCount: 0 };
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cart: Cart) => {
        this.cart = cart;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Update item quantity
  updateQuantity(serviceId: string, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(serviceId);
      return;
    }
    this.cartService.updateQuantity(serviceId, quantity);
  }

  // Remove item from cart
  removeItem(serviceId: string): void {
    this.cartService.removeFromCart(serviceId);
  }

  // Clear entire cart
  clearCart(): void {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dịch vụ khỏi giỏ hàng?')) {
      this.cartService.clearCart();
    }
  }

  // Format price for display
  formatPrice(price: number): string {
    return this.cartService.formatPrice(price);
  }

  // Calculate item total
  getItemTotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  // Check if cart is empty
  isCartEmpty(): boolean {
    return this.cart.items.length === 0;
  }

  // Get estimated total duration
  getTotalDuration(): number {
    return this.cart.items.reduce((total, item) => {
      return total + (item.duration || 0) * item.quantity;
    }, 0);
  }

  // Format duration for display
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }
    return `${hours} giờ ${remainingMinutes} phút`;
  }

  // Track by function for ngFor
  trackByServiceId(index: number, item: CartItem): string {
    return item.service_id;
  }
}
