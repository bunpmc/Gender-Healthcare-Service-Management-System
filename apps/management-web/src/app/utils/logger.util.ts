import { environment } from '../environments/environment';

export class Logger {
    static log(message: string, ...args: any[]): void {
        if (!environment.production) {
            console.log(message, ...args);
        }
    }

    static error(message: string, ...args: any[]): void {
        if (!environment.production) {
            console.error(message, ...args);
        } else {
            // In production, you might want to send errors to a logging service
            // this.sendToLoggingService(message, args);
        }
    }

    static warn(message: string, ...args: any[]): void {
        if (!environment.production) {
            console.warn(message, ...args);
        }
    }

    static info(message: string, ...args: any[]): void {
        if (!environment.production) {
            console.info(message, ...args);
        }
    }

    // Optional: Send to external logging service in production
    // private static sendToLoggingService(message: string, args: any[]): void {
    //   // Implementation for external logging service
    // }
}
