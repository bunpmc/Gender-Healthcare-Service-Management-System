import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandlerService } from '../services/error-handler.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private errorHandler: ErrorHandlerService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only handle certain types of errors automatically
        // Let component-specific errors be handled by the components themselves
        if (this.shouldHandleGlobally(error)) {
          this.errorHandler.handleHttpError(error);
        }

        // Always re-throw the error so components can handle it if needed
        return throwError(() => error);
      })
    );
  }

  private shouldHandleGlobally(error: HttpErrorResponse): boolean {
    // Only handle severe network errors that prevent the app from functioning
    // Don't handle API errors globally - let components handle them

    // Handle complete network failures (no internet connection)
    if (error.status === 0 && !navigator.onLine) {
      return true;
    }

    // Handle timeout errors only if they're not API calls
    if (error.status === -1 && error.url && !error.url.includes('/api/')) {
      return true;
    }

    // Don't handle 404 errors globally - they should be handled by routing or components
    // Don't handle server errors globally - let components decide how to handle them

    // Let components handle all other errors
    return false;
  }
}
