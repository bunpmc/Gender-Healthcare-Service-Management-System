import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ErrorHandlerService } from './error-handler.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    console.error('Global error caught:', error);

    // Only handle critical errors that prevent the app from functioning
    // Don't redirect to error page for minor issues

    if (this.isCriticalError(error)) {
      // Get the error handler service
      const errorHandlerService = this.injector.get(ErrorHandlerService);

      // Handle the error
      errorHandlerService.handleGlobalError(error);
    }

    // Always log to console for debugging
    console.error('Original error:', error);
  }

  private isCriticalError(error: any): boolean {
    // Only consider these as critical errors that should show error page:

    // Chunk loading errors (usually network issues)
    if (
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Loading CSS chunk')
    ) {
      return true;
    }

    // Complete application crashes
    if (
      error.name === 'ReferenceError' &&
      error.message?.includes('is not defined')
    ) {
      return true;
    }

    // Don't treat other errors as critical
    return false;
  }
}
