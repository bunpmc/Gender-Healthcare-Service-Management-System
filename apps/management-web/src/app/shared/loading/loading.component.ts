import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div class="loading-text">
        <h3>Loading...</h3>
        <p>Please wait while we prepare your dashboard</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      padding: 2rem;
    }

    .loading-spinner {
      position: relative;
      width: 80px;
      height: 80px;
      margin-bottom: 2rem;
    }

    .spinner-ring {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 4px solid transparent;
      border-top: 4px solid #4f46e5;
      border-radius: 50%;
      animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    }

    .spinner-ring:nth-child(1) { animation-delay: -0.45s; }
    .spinner-ring:nth-child(2) { animation-delay: -0.3s; }
    .spinner-ring:nth-child(3) { animation-delay: -0.15s; }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      text-align: center;
    }

    .loading-text h3 {
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .loading-text p {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Fade in animation */
    .loading-container {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoadingComponent { }
