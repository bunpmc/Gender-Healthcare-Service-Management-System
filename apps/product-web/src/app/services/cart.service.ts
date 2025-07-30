import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Cart } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>({
    items: [],
    total: 0,
    itemCount: 0
  });

  public cart$ = this.cartSubject.asObservable();

  constructor() {
    // Load cart from localStorage on service initialization
    this.loadCartFromStorage();
  }

  // Get current cart state
  getCurrentCart(): Cart {
    return this.cartSubject.value;
  }

  // Add item to cart
  addToCart(item: CartItem): void {
    console.log('🛒 Adding to cart:', item);
    const currentCart = this.getCurrentCart();
    console.log('🛒 Current cart before:', currentCart);

    const existingItemIndex = currentCart.items.findIndex(
      cartItem => cartItem.service_id === item.service_id
    );

    if (existingItemIndex > -1) {
      // Update quantity if item already exists
      currentCart.items[existingItemIndex].quantity += item.quantity;
      console.log('🛒 Updated existing item');
    } else {
      // Add new item to cart
      currentCart.items.push({ ...item });
      console.log('🛒 Added new item');
    }

    this.updateCart(currentCart);
  }

  // Remove item from cart
  removeFromCart(serviceId: string): void {
    const currentCart = this.getCurrentCart();
    currentCart.items = currentCart.items.filter(
      item => item.service_id !== serviceId
    );
    this.updateCart(currentCart);
  }

  // Update item quantity
  updateQuantity(serviceId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(serviceId);
      return;
    }

    const currentCart = this.getCurrentCart();
    const itemIndex = currentCart.items.findIndex(
      item => item.service_id === serviceId
    );

    if (itemIndex > -1) {
      currentCart.items[itemIndex].quantity = quantity;
      this.updateCart(currentCart);
    }
  }

  // Clear entire cart
  clearCart(): void {
    const emptyCart: Cart = {
      items: [],
      total: 0,
      itemCount: 0
    };
    this.updateCart(emptyCart);
  }

  // Get cart item count
  getItemCount(): number {
    return this.getCurrentCart().itemCount;
  }

  // Get cart total
  getTotal(): number {
    return this.getCurrentCart().total;
  }

  // Check if item is in cart
  isInCart(serviceId: string): boolean {
    return this.getCurrentCart().items.some(item => item.service_id === serviceId);
  }

  // Get specific item from cart
  getCartItem(serviceId: string): CartItem | undefined {
    return this.getCurrentCart().items.find(item => item.service_id === serviceId);
  }

  // Private method to update cart and recalculate totals
  private updateCart(cart: Cart): void {
    // Recalculate totals
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    console.log('🛒 Cart updated:', {
      itemCount: cart.itemCount,
      total: cart.total,
      items: cart.items.length
    });

    // Update BehaviorSubject
    this.cartSubject.next(cart);

    // Save to localStorage
    this.saveCartToStorage(cart);
  }

  // Save cart to localStorage
  private saveCartToStorage(cart: Cart): void {
    try {
      localStorage.setItem('healthcare_cart', JSON.stringify(cart));
    } catch (error) {
      // Silent fail for localStorage issues
    }
  }

  // Load cart from localStorage
  private loadCartFromStorage(): void {
    console.log('🔄 Loading cart from localStorage...');
    try {
      const savedCart = localStorage.getItem('healthcare_cart');
      console.log('💾 Saved cart data:', savedCart);

      if (savedCart) {
        const cart: Cart = JSON.parse(savedCart);
        console.log('📦 Parsed cart:', cart);

        // Recalculate totals in case of data inconsistency
        this.updateCart(cart);
      } else {
        console.log('📭 No saved cart found, initializing empty cart');
        // Initialize with empty cart and emit
        const emptyCart = this.createEmptyCart();
        this.cartSubject.next(emptyCart);
      }
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      // Silent fail for localStorage issues
      this.clearCart();
    }
  }

  // Format price for display (Vietnamese Dong)
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  // Generate order info for VNPay
  generateOrderInfo(): string {
    const cart = this.getCurrentCart();
    const serviceNames = cart.items.map(item => item.service_name).join(', ');
    const orderNumber = Date.now().toString().slice(-6);
    return `Payment for Order #${orderNumber}: ${serviceNames}`;
  }



  // Create empty cart
  private createEmptyCart(): Cart {
    return {
      items: [],
      total: 0,
      itemCount: 0
    };
  }
}
