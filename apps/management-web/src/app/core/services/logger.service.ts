import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, args);
  }

  error(message: string, error?: any, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, [error, ...args]);
  }

  private log(level: LogLevel, message: string, args: any[]): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${LogLevel[level]}: ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, ...args);
        break;
      case LogLevel.INFO:
        console.info(logMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, ...args);
        // In production, send to external logging service
        if (environment.production) {
          this.sendToExternalLogger(level, message, args);
        }
        break;
    }
  }

  private sendToExternalLogger(level: LogLevel, message: string, args: any[]): void {
    // TODO: Implement integration with Sentry, LogRocket, or other logging services
    // Example: Sentry.captureException(new Error(message));
  }
}
