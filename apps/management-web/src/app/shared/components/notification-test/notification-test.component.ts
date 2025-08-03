import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-notification-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 space-y-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Test Notification System</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Direct Notification Tests -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800">Direct Notifications</h3>
            
            <button 
              (click)="showSuccess()"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              Show Success
            </button>
            
            <button 
              (click)="showError()"
              class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              Show Error
            </button>
            
            <button 
              (click)="showWarning()"
              class="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
              Show Warning
            </button>
            
            <button 
              (click)="showInfo()"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Show Info
            </button>
          </div>
          
          <!-- Error Handler Tests -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800">Error Handler Tests</h3>
            
            <button 
              (click)="testApiError()"
              class="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              Test API Error
            </button>
            
            <button 
              (click)="testNetworkError()"
              class="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              Test Network Error
            </button>
            
            <button 
              (click)="testValidationError()"
              class="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              Test Validation Error
            </button>
            
            <button 
              (click)="testGenericError()"
              class="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              Test Generic Error
            </button>
          </div>
        </div>
        
        <!-- Multiple Notifications Test -->
        <div class="mt-8">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Multiple Notifications Test</h3>
          <button 
            (click)="showMultiple()"
            class="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
            Show Multiple Notifications
          </button>
        </div>
        
        <!-- Clear All Notifications -->
        <div class="mt-6">
          <button 
            (click)="clearAll()"
            class="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
            Clear All Notifications
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 2rem 0;
    }
  `]
})
export class NotificationTestComponent {
  
  constructor(
    private readonly notificationService: NotificationService,
    private readonly errorHandler: ErrorHandlerService
  ) {}

  showSuccess(): void {
    this.notificationService.showSuccess(
      'Operation completed successfully!', 
      5000
    );
  }

  showError(): void {
    this.notificationService.showError(
      'An error occurred while processing your request',
      5000
    );
  }

  showWarning(): void {
    this.notificationService.showWarning(
      'Please check your input data before proceeding',
      5000
    );
  }

  showInfo(): void {
    this.notificationService.showInfo(
      'New features have been added to the system',
      5000
    );
  }

  testApiError(): void {
    const error = new Error('API Error') as any;
    error.status = 400;
    error.error = {
      message: 'Invalid request parameters',
      details: 'The user ID parameter is required'
    };
    this.errorHandler.handleApiError(error, 'Failed to load user data');
  }

  testNetworkError(): void {
    const error = new Error('Network Error') as any;
    error.status = 0;
    this.errorHandler.handleNetworkError(error);
  }

  testValidationError(): void {
    this.errorHandler.handleValidationError('Email format is invalid');
  }

  testGenericError(): void {
    const error = new Error('Something went wrong');
    this.errorHandler.handleError({
      error,
      context: 'Generic Error Test',
      userMessage: 'Processing failed due to an unexpected error'
    });
  }

  showMultiple(): void {
    setTimeout(() => this.showSuccess(), 0);
    setTimeout(() => this.showInfo(), 200);
    setTimeout(() => this.showWarning(), 400);
    setTimeout(() => this.showError(), 600);
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }
}
