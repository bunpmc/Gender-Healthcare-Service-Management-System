import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

interface RouteMetrics {
  path: string;
  loadTime: number;
  timestamp: number;
  cacheHit?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LazyLoadingPerformanceService {
  private metrics: RouteMetrics[] = [];
  private loadStartTimes = new Map<string, number>();

  constructor(private router: Router) {
    this.initializeRouteMonitoring();
  }

  private initializeRouteMonitoring(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.recordRouteLoad(event.url);
      });
  }

  startRouteLoad(path: string): void {
    this.loadStartTimes.set(path, performance.now());
  }

  endRouteLoad(path: string, cacheHit: boolean = false): void {
    const startTime = this.loadStartTimes.get(path);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      this.recordMetric({
        path,
        loadTime,
        timestamp: Date.now(),
        cacheHit
      });
      this.loadStartTimes.delete(path);
    }
  }

  private recordRouteLoad(url: string): void {
    const startTime = this.loadStartTimes.get(url);
    if (startTime) {
      this.endRouteLoad(url);
    }
  }

  private recordMetric(metric: RouteMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 50 metrics to prevent memory bloat
    if (this.metrics.length > 50) {
      this.metrics = this.metrics.slice(-50);
    }

    // Log performance in development
    if (!this.isProduction()) {
      console.log(`🚀 Route Load Performance: ${metric.path} - ${metric.loadTime.toFixed(2)}ms ${metric.cacheHit ? '(cached)' : ''}`);
    }
  }

  getMetrics(): RouteMetrics[] {
    return [...this.metrics];
  }

  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return total / this.metrics.length;
  }

  getSlowRoutes(threshold: number = 1000): RouteMetrics[] {
    return this.metrics.filter(metric => metric.loadTime > threshold);
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const cacheHits = this.metrics.filter(metric => metric.cacheHit).length;
    return (cacheHits / this.metrics.length) * 100;
  }

  generatePerformanceReport(): string {
    const avgLoadTime = this.getAverageLoadTime();
    const cacheHitRate = this.getCacheHitRate();
    const slowRoutes = this.getSlowRoutes();
    
    return `
🔍 Lazy Loading Performance Report
=====================================
📊 Average Load Time: ${avgLoadTime.toFixed(2)}ms
🎯 Cache Hit Rate: ${cacheHitRate.toFixed(1)}%
📈 Total Routes Loaded: ${this.metrics.length}
🐌 Slow Routes (>1s): ${slowRoutes.length}

${slowRoutes.length > 0 ? '⚠️ Slow Routes:\n' + slowRoutes.map(r => `   ${r.path}: ${r.loadTime.toFixed(2)}ms`).join('\n') : '✅ All routes are performing well!'}
    `.trim();
  }

  private isProduction(): boolean {
    return !!(window as any).__env?.production;
  }

  clearMetrics(): void {
    this.metrics = [];
    this.loadStartTimes.clear();
  }
}
