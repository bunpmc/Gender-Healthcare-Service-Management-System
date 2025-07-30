import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ErrorNavigationUtil } from '../../utils/error-navigation.util';

@Component({
  selector: 'app-error-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-bold mb-4">Error Page Demo</h2>
      <div class="space-y-2">
        <button 
          (click)="triggerNetworkError()" 
          class="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Trigger Network Error
        </button>
        <button 
          (click)="trigger404Error()" 
          class="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
          Trigger 404 Error
        </button>
        <button 
          (click)="triggerServerError()" 
          class="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Trigger Server Error
        </button>
        <button 
          (click)="triggerGenericError()" 
          class="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Trigger Generic Error
        </button>
      </div>
    </div>
  `
})
export class ErrorDemoComponent {

  constructor(
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  triggerNetworkError(): void {
    ErrorNavigationUtil.navigateToNetworkError(this.router);
  }

  trigger404Error(): void {
    ErrorNavigationUtil.navigateTo404(this.router);
  }

  triggerServerError(): void {
    ErrorNavigationUtil.navigateToServerError(this.router);
  }

  triggerGenericError(): void {
    this.errorHandler.navigateToError({
      type: 'generic',
      title: 'Custom Error Title',
      message: 'This is a custom error message for demonstration purposes.',
      showRetry: true,
      showHome: true,
      showBack: true
    });
  }
}
