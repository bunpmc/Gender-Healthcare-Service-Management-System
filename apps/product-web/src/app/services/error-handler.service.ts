import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorNavigationOptions {
  type?: 'network' | '404' | '500' | 'generic';
  title?: string;
  message?: string;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(private router: Router) {}

  /**
   * Navigate to error page with specific error data
   */
  navigateToError(options: ErrorNavigationOptions = {}): void {
    // Prevent infinite redirects - don't navigate to error page if already there
    if (this.router.url.startsWith('/error')) {
      console.warn('Already on error page, preventing redirect loop');
      return;
    }

    // Don't redirect to error page from homepage unless it's a critical error
    if (this.router.url === '/' && options.type !== 'network') {
      console.warn(
        'Preventing error redirect from homepage for non-critical error'
      );
      return;
    }

    this.router.navigate(['/error'], {
      state: {
        type: options.type || 'generic',
        title: options.title,
        message: options.message,
        showRetry: options.showRetry !== false,
        showHome: options.showHome !== false,
        showBack: options.showBack || false,
      },
    });
  }

  /**
   * Handle HTTP errors and navigate to appropriate error page
   * Only for critical errors that should show error page
   */
  handleHttpError(error: HttpErrorResponse): void {
    console.error('HTTP Error occurred:', error);

    // Only handle truly critical errors that prevent app functionality
    if (this.isNetworkError(error) && !navigator.onLine) {
      // Only show network error if completely offline
      this.navigateToError({
        type: 'network',
        showRetry: true,
        showHome: true,
        showBack: false,
      });
    } else {
      // For all other HTTP errors, just log them
      // Let components handle their own error states
      console.warn(
        'HTTP error not handled globally:',
        error.status,
        error.message
      );
    }
  }

  /**
   * Check if error is a network connectivity issue
   */
  private isNetworkError(error: HttpErrorResponse): boolean {
    return (
      error.status === 0 || // Network error
      error.status === -1 || // Timeout
      (error as any).name === 'TimeoutError' ||
      (error as any).name === 'NetworkError' ||
      (error.error instanceof ProgressEvent && error.error.type === 'error') ||
      !navigator.onLine // Browser offline
    );
  }

  /**
   * Navigate to 404 error page
   */
  navigateTo404(): void {
    this.navigateToError({
      type: '404',
      showRetry: false,
      showHome: true,
      showBack: true,
    });
  }

  /**
   * Navigate to network error page
   */
  navigateToNetworkError(): void {
    this.navigateToError({
      type: 'network',
      showRetry: true,
      showHome: true,
      showBack: false,
    });
  }

  /**
   * Navigate to server error page
   */
  navigateToServerError(): void {
    this.navigateToError({
      type: '500',
      showRetry: true,
      showHome: true,
      showBack: false,
    });
  }

  /**
   * Check if user is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Set up network status monitoring
   */
  setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      // Optionally show a toast notification
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      // Don't automatically redirect to error page when offline
      // Let components handle offline state individually
    });
  }

  /**
   * Test network connectivity
   */
  async testConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/assets/test-connectivity.txt', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Handle global application errors
   */
  handleGlobalError(error: any): void {
    console.error('Global error occurred:', error);

    // Check if it's a network-related error
    if (
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Loading CSS chunk')
    ) {
      this.navigateToNetworkError();
      return;
    }

    // Handle other types of errors
    this.navigateToError({
      type: 'generic',
      message:
        'An unexpected error occurred. Please refresh the page and try again.',
      showRetry: true,
      showHome: true,
      showBack: false,
    });
  }
}
