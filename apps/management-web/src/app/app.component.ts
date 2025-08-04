import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceMonitorComponent } from './shared/performance-monitor/performance-monitor.component';
import { CSSBundleService } from './core/services/css-bundle.service';
import { LayoutComponent } from './core/layout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PerformanceMonitorComponent, LayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Healthcare Staff Portal';

  constructor(private cssBundleService: CSSBundleService) {}

  ngOnInit(): void {
    // Only monitor CSS performance in development (check if not minified)
    const isProduction = !!(window as any).ng?.ɵglobal?.environment?.production;
    
    if (!isProduction) {
      // Delay logging to allow CSS to fully load
      setTimeout(() => {
        this.cssBundleService.logMetrics();
      }, 3000);
    }
  }

  ngOnDestroy(): void {
    this.cssBundleService.destroy();
  }
}
