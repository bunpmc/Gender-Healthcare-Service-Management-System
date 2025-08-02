import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ErrorHandlerService } from '../services/error-handler.service';
import { PerformanceMonitorService } from '../services/performance-monitor.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
  constructor(
    private errorHandler: ErrorHandlerService,
    private performanceMonitor: PerformanceMonitorService,
    private logger: LoggerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();
    const requestUrl = this.getCleanUrl(req.url);

    // Add common headers
    const modifiedReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'X-Request-ID': this.generateRequestId()
      }
    });

    this.logger.debug(`HTTP ${req.method} request to ${requestUrl}`, { headers: req.headers });

    return next.handle(modifiedReq).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = performance.now() - startTime;
          this.performanceMonitor.trackApiCall(requestUrl, duration, event.status);
          this.logger.debug(`HTTP ${req.method} ${requestUrl} completed in ${duration.toFixed(2)}ms`, {
            status: event.status,
            statusText: event.statusText
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const duration = performance.now() - startTime;
        this.performanceMonitor.trackApiCall(requestUrl, duration, error.status);
        
        this.logger.error(`HTTP ${req.method} ${requestUrl} failed after ${duration.toFixed(2)}ms`, error, {
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });

        // Handle different types of HTTP errors
        this.handleHttpError(error, requestUrl);
        
        return throwError(() => error);
      })
    );
  }

  private handleHttpError(error: HttpErrorResponse, url: string): void {
    let userMessage = 'An unexpected error occurred.';
    
    switch (error.status) {
      case 0:
        userMessage = 'Network connection error. Please check your internet connection.';
        this.errorHandler.handleNetworkError(error, userMessage);
        break;
      case 400:
        userMessage = 'Invalid request. Please check your input and try again.';
        this.errorHandler.handleValidationError(error.error, userMessage);
        break;
      case 401:
        userMessage = 'You are not authorized. Please log in again.';
        this.errorHandler.handleError({
          error,
          context: 'Authentication Error',
          userMessage,
          shouldNotifyUser: true
        });
        break;
      case 403:
        userMessage = 'You do not have permission to perform this action.';
        this.errorHandler.handleError({
          error,
          context: 'Authorization Error', 
          userMessage,
          shouldNotifyUser: true
        });
        break;
      case 404:
        userMessage = 'The requested resource was not found.';
        this.errorHandler.handleError({
          error,
          context: 'Not Found Error',
          userMessage,
          shouldNotifyUser: false // Usually not critical for user
        });
        break;
      case 500:
        userMessage = 'Server error. Please try again later.';
        this.errorHandler.handleError({
          error,
          context: 'Server Error',
          userMessage,
          shouldNotifyUser: true
        });
        break;
      default:
        this.errorHandler.handleError({
          error,
          context: 'HTTP Error',
          userMessage,
          shouldNotifyUser: true
        });
    }
  }

  private getCleanUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || 'unknown';
    } catch {
      return url.split('/').pop() || 'unknown';
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
