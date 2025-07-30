import { Router } from '@angular/router';
import { ErrorNavigationOptions } from '../services/error-handler.service';

/**
 * Utility functions for error navigation
 * These can be used in components for easy error handling
 */
export class ErrorNavigationUtil {
  
  /**
   * Navigate to network error page
   */
  static navigateToNetworkError(router: Router): void {
    router.navigate(['/error'], {
      queryParams: { type: 'network' }
    });
  }

  /**
   * Navigate to 404 error page
   */
  static navigateTo404(router: Router): void {
    router.navigate(['/error'], {
      queryParams: { type: '404' }
    });
  }

  /**
   * Navigate to server error page
   */
  static navigateToServerError(router: Router): void {
    router.navigate(['/error'], {
      queryParams: { type: '500' }
    });
  }

  /**
   * Navigate to generic error page with custom message
   */
  static navigateToGenericError(router: Router, message?: string): void {
    const state: ErrorNavigationOptions = {
      type: 'generic',
      message: message,
      showRetry: true,
      showHome: true,
      showBack: false
    };
    
    router.navigate(['/error'], { state });
  }

  /**
   * Check if current error is a network error
   */
  static isNetworkError(error: any): boolean {
    return (
      error.status === 0 ||
      error.status === -1 ||
      error.name === 'TimeoutError' ||
      error.name === 'NetworkError' ||
      (error.error instanceof ProgressEvent && error.error.type === 'error') ||
      !navigator.onLine
    );
  }

  /**
   * Handle common HTTP errors and navigate appropriately
   */
  static handleHttpError(router: Router, error: any): void {
    if (this.isNetworkError(error)) {
      this.navigateToNetworkError(router);
    } else if (error.status === 404) {
      this.navigateTo404(router);
    } else if (error.status >= 500) {
      this.navigateToServerError(router);
    } else {
      this.navigateToGenericError(router, error.message);
    }
  }
}
