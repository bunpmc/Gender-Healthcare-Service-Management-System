import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyLoadingPerformanceService } from '../services/lazy-loading-performance.service';
import { ComponentCacheGuard } from '../guards/component-cache.guard';

@Component({
  selector: 'app-performance-monitor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="performance-monitor" *ngIf="showMonitor">
      <div class="monitor-header">
        <h4>🚀 Performance Monitor</h4>
        <button (click)="toggleMonitor()" class="close-btn">×</button>
      </div>
      
      <div class="monitor-content">
        <div class="metric">
          <span class="label">Avg Load Time:</span>
          <span class="value">{{ averageLoadTime.toFixed(2) }}ms</span>
        </div>
        
        <div class="metric">
          <span class="label">Cache Hit Rate:</span>
          <span class="value">{{ cacheHitRate.toFixed(1) }}%</span>
        </div>
        
        <div class="metric">
          <span class="label">Routes Loaded:</span>
          <span class="value">{{ totalRoutes }}</span>
        </div>
        
        <div class="metric">
          <span class="label">Cache Size:</span>
          <span class="value">{{ cacheSize }}</span>
        </div>
        
        <div class="actions">
          <button (click)="generateReport()" class="action-btn">📊 Report</button>
          <button (click)="clearMetrics()" class="action-btn">🗑️ Clear</button>
        </div>
      </div>
    </div>
    
    <button 
      *ngIf="!showMonitor" 
      (click)="toggleMonitor()" 
      class="monitor-toggle">
      📈
    </button>
  `,
  styles: [`
    .performance-monitor {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      min-width: 280px;
      font-size: 12px;
    }

    .monitor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .monitor-header h4 {
      margin: 0;
      font-size: 14px;
      color: #374151;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #374151;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      padding: 4px 0;
    }

    .label {
      color: #6b7280;
      font-weight: 500;
    }

    .value {
      color: #374151;
      font-weight: 600;
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
    }

    .action-btn {
      flex: 1;
      padding: 6px 8px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #e5e7eb;
    }

    .monitor-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      z-index: 1000;
      font-size: 16px;
      transition: all 0.2s;
    }

    .monitor-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
    }

    /* Only show in development */
    @media (min-width: 1024px) {
      .performance-monitor,
      .monitor-toggle {
        display: block;
      }
    }

    @media (max-width: 1023px) {
      .performance-monitor,
      .monitor-toggle {
        display: none;
      }
    }
  `]
})
export class PerformanceMonitorComponent implements OnInit {
  showMonitor = false;
  averageLoadTime = 0;
  cacheHitRate = 0;
  totalRoutes = 0;
  cacheSize = 0;

  constructor(
    private performanceService: LazyLoadingPerformanceService,
    private cacheGuard: ComponentCacheGuard
  ) {}

  ngOnInit(): void {
    // Only show in development mode
    this.showMonitor = !this.isProduction();
    this.updateMetrics();
    
    // Update metrics every 5 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 5000);
  }

  toggleMonitor(): void {
    this.showMonitor = !this.showMonitor;
  }

  updateMetrics(): void {
    this.averageLoadTime = this.performanceService.getAverageLoadTime();
    this.cacheHitRate = this.performanceService.getCacheHitRate();
    this.totalRoutes = this.performanceService.getMetrics().length;
    this.cacheSize = this.cacheGuard.getCacheSize();
  }

  generateReport(): void {
    const report = this.performanceService.generatePerformanceReport();
    console.log(report);
    alert('Performance report generated! Check console for details.');
  }

  clearMetrics(): void {
    this.performanceService.clearMetrics();
    this.cacheGuard.clearCache();
    this.updateMetrics();
    console.log('🧹 Performance metrics and cache cleared');
  }

  private isProduction(): boolean {
    return !!(window as any).__env?.production;
  }
}
