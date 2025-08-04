import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Logger } from '../utils/logger.util';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

    handleError(error: any): void {
        // Log error appropriately based on environment
        if (environment.production) {
            // In production, send to external logging service
            this.logToService(error);
        } else {
            // In development, log to console with full details
            Logger.error('Global error caught:', error);
        }

        // You could also show user-friendly error messages here
        this.showUserFriendlyError(error);
    }

    private logToService(error: any): void {
        // Implementation for external logging service (e.g., Sentry, LogRocket)
        // Example:
        // this.sentryService.captureException(error);

        // For now, just log critical errors
        if (this.isCriticalError(error)) {
            console.error('Critical error:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    }

    private isCriticalError(error: any): boolean {
        // Define what constitutes a critical error
        const criticalMessages = [
            'Network error',
            'Authentication failed',
            'Database connection lost',
            'Failed to load essential data'
        ];

        return criticalMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        );
    }

    private showUserFriendlyError(error: any): void {
        // Show user-friendly error messages
        // This could integrate with your notification system

        if (error.message?.includes('Network')) {
            // Show network error notification
        } else if (error.message?.includes('Authentication')) {
            // Redirect to login or show auth error
        }
        // Add more specific error handling as needed
    }
}
