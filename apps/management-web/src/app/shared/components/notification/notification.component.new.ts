import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      @for (notification of notifications; track notification.id) {
        <div 
          [class]="getNotificationClasses(notification.type)" 
          class="notification-container p-4 rounded-lg shadow-lg border-l-4 flex items-start space-x-3 min-w-[400px] max-w-[500px]"
          role="alert"
          [attr.aria-label]="notification.message"
        >
          <div class="flex-shrink-0">
            @switch (notification.type) {
              @case ('success') {
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
              }
              @case ('info') {
                <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
              }
            }
          </div>
          
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium" [class]="getTextClasses(notification.type)">
              {{ notification.message }}
            </p>
            @if (notification.details) {
              <p class="mt-1 text-xs opacity-75" [class]="getTextClasses(notification.type)">
                {{ notification.details }}
              </p>
            }
            @if (notification.timestamp) {
              <p class="mt-1 text-xs opacity-60" [class]="getTextClasses(notification.type)">
                {{ formatTime(notification.timestamp) }}
              </p>
            }
          </div>
          
          <div class="flex-shrink-0">
            <button
              type="button"
              class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200"
              [class]="getCloseButtonClasses(notification.type)"
              (click)="removeNotification(notification.id || '')"
              aria-label="Đóng thông báo"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 50;
      pointer-events: none;
    }
    
    .notification-container {
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
    }
    
    .notification-container.removing {
      animation: slideOut 0.3s ease-in forwards;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
    
    .notification-enter {
      opacity: 0;
      transform: translateX(100%);
    }
    
    .notification-enter-active {
      opacity: 1;
      transform: translateX(0);
      transition: all 0.3s ease-in-out;
    }
    
    .notification-exit {
      opacity: 1;
      transform: translateX(0);
    }
    
    .notification-exit-active {
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease-in-out;
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications: Notification[]) => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  getNotificationClasses(type: Notification['type']): string {
    const baseClasses = 'border-l-4 ';
    switch (type) {
      case 'success':
        return baseClasses + 'border-green-400 bg-green-50 text-green-900';
      case 'error':
        return baseClasses + 'border-red-400 bg-red-50 text-red-900';
      case 'warning':
        return baseClasses + 'border-yellow-400 bg-yellow-50 text-yellow-900';
      case 'info':
        return baseClasses + 'border-blue-400 bg-blue-50 text-blue-900';
      default:
        return baseClasses + 'border-gray-400 bg-gray-50 text-gray-900';
    }
  }

  getTextClasses(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  }

  getCloseButtonClasses(type: Notification['type']): string {
    const baseClasses = 'hover:bg-opacity-20 focus:ring-2 ';
    switch (type) {
      case 'success':
        return baseClasses + 'text-green-600 hover:bg-green-200 focus:ring-green-500';
      case 'error':
        return baseClasses + 'text-red-600 hover:bg-red-200 focus:ring-red-500';
      case 'warning':
        return baseClasses + 'text-yellow-600 hover:bg-yellow-200 focus:ring-yellow-500';
      case 'info':
        return baseClasses + 'text-blue-600 hover:bg-blue-200 focus:ring-blue-500';
      default:
        return baseClasses + 'text-gray-600 hover:bg-gray-200 focus:ring-gray-500';
    }
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
