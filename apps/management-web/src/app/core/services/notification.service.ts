import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  timestamp?: Date;
  details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);

  constructor() {}

  /**
   * Get all notifications as observable
   */
  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  /**
   * Show success notification
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.addNotification({
      message,
      type: 'success',
      duration
    });
  }

  /**
   * Show error notification
   */
  showError(message: string, duration: number = 5000): void {
    this.addNotification({
      message,
      type: 'error',
      duration
    });
  }

  /**
   * Show warning notification
   */
  showWarning(message: string, duration: number = 4000): void {
    this.addNotification({
      message,
      type: 'warning',
      duration
    });
  }

  /**
   * Show info notification
   */
  showInfo(message: string, duration: number = 3000): void {
    this.addNotification({
      message,
      type: 'info',
      duration
    });
  }

  /**
   * Remove notification by id
   */
  removeNotification(id: string): void {
    const current = this.notifications$.value;
    const updated = current.filter(notification => notification.id !== id);
    this.notifications$.next(updated);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications$.next([]);
  }

  /**
   * Add notification to the list
   */
  private addNotification(notification: Notification): void {
    const id = this.generateId();
    const timestamp = new Date();
    
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp
    };

    const current = this.notifications$.value;
    this.notifications$.next([newNotification, ...current]);

    // Auto remove after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration);
    }
  }

  /**
   * Generate unique id for notification
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
