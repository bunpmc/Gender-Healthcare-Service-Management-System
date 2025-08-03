import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';

export interface ErrorInfo {
  error: any;
  context?: string;
  userMessage?: string;
  shouldNotifyUser?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  
  constructor(private notificationService: NotificationService) {}

  /**
   * Handle error with consistent logging and user notification
   */
  handleError(errorInfo: ErrorInfo): void {
    const { error, context, userMessage, shouldNotifyUser = true } = errorInfo;
    
    // Log error to console (development) or external service (production)
    this.logError(error, context);
    
    // Show user-friendly message if needed
    if (shouldNotifyUser && userMessage) {
      this.notificationService.showError(userMessage);
    }
  }

  /**
   * Handle API response errors
   */
  handleApiError(error: any, operation: string, userMessage?: string): void {
    const context = `API Error in ${operation}`;
    const defaultMessage = 'An unexpected error occurred. Please try again.';
    
    this.handleError({
      error,
      context,
      userMessage: userMessage || defaultMessage,
      shouldNotifyUser: true
    });
  }

  /**
   * Handle form validation errors
   */
  handleValidationError(errors: any, userMessage?: string): void {
    const context = 'Form Validation Error';
    const defaultMessage = 'Please check your input and try again.';
    
    this.handleError({
      error: errors,
      context,
      userMessage: userMessage || defaultMessage,
      shouldNotifyUser: true
    });
  }

  /**
   * Handle network/connectivity errors
   */
  handleNetworkError(error: any, userMessage?: string): void {
    const context = 'Network Error';
    const defaultMessage = 'Connection error. Please check your internet connection.';
    
    this.handleError({
      error,
      context,
      userMessage: userMessage || defaultMessage,
      shouldNotifyUser: true
    });
  }

  /**
   * Log error to console or external service
   */
  private logError(error: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      context: context || 'Unknown Context',
      error: {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name,
        raw: error
      }
    };

    // In development, log to console
    if (!this.isProduction()) {
      console.group(`🚨 Error ${context ? `in ${context}` : ''}`);
      console.error('Timestamp:', timestamp);
      console.error('Error:', error);
      if (context) console.error('Context:', context);
      console.groupEnd();
    }

    // In production, send to external logging service
    // TODO: Implement external logging (e.g., Sentry, LogRocket, etc.)
    if (this.isProduction()) {
      // this.sendToExternalLoggingService(logEntry);
    }
  }

  /**
   * Check if running in production
   */
  private isProduction(): boolean {
    return !!(window as any).ng?.ɵglobal?.environment?.production;
  }

  /**
   * Show success message
   */
  showSuccess(message: string): void {
    this.notificationService.showSuccess(message);
  }

  /**
   * Show info message
   */
  showInfo(message: string): void {
    this.notificationService.showInfo(message);
  }

  /**
   * Show warning message
   */
  showWarning(message: string): void {
    this.notificationService.showWarning(message);
  }
}
