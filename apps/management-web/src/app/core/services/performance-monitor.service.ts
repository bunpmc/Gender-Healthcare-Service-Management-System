import { Injectable, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  sessionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];

  constructor() {
    if (environment.production) {
      this.initializePerformanceObserver();
    }
  }

  /**
   * Track custom performance metrics
   */
  trackMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.metrics.push(metric);
    
    if (environment.production) {
      this.sendMetric(metric);
    } else {
      console.debug('Performance metric:', metric);
    }
  }

  /**
   * Track page load performance
   */
  trackPageLoad(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.trackMetric('page_load_time', navigation.loadEventEnd - navigation.navigationStart);
        this.trackMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.navigationStart);
        this.trackMetric('first_paint', this.getFirstPaint());
      }
    }
  }

  /**
   * Track Angular component render time
   */
  trackComponentRender(componentName: string, startTime: number): void {
    const renderTime = performance.now() - startTime;
    this.trackMetric(`component_render_${componentName}`, renderTime);
  }

  /**
   * Track API response times
   */
  trackApiCall(endpoint: string, duration: number, status: number): void {
    this.trackMetric(`api_call_${endpoint}`, duration);
    this.trackMetric(`api_status_${status}`, 1);
  }

  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackMetric('largest_contentful_paint', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.trackMetric('first_input_delay', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private sendMetric(metric: PerformanceMetric): void {
    // TODO: Send to analytics service (Google Analytics, etc.)
    // navigator.sendBeacon('/analytics', JSON.stringify(metric));
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear collected metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}
