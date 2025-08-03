/* CSS Bundle Performance Service
 * Monitor CSS bundle size and performance metrics
 */

import { Injectable } from '@angular/core';

export interface CSSMetrics {
  totalStylesheets: number;
  totalCSSSize: number;
  criticalCSSSize: number;
  unusedCSS: number;
  loadTime: number;
  renderTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class CSSBundleService {
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: CSSMetrics = {
    totalStylesheets: 0,
    totalCSSSize: 0,
    criticalCSSSize: 0,
    unusedCSS: 0,
    loadTime: 0,
    renderTime: 0
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializePerformanceObserver();
      this.analyzeCSSBundle();
    }
  }

  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('.css')) {
            this.updateCSSMetrics(entry);
          }
        }
      });

      this.performanceObserver.observe({ 
        entryTypes: ['resource', 'navigation', 'measure'] 
      });
    }
  }

  private updateCSSMetrics(entry: PerformanceEntry): void {
    if (entry instanceof PerformanceResourceTiming) {
      this.metrics.totalStylesheets++;
      this.metrics.totalCSSSize += entry.transferSize || 0;
      this.metrics.loadTime = Math.max(this.metrics.loadTime, entry.duration);
    }
  }

  private analyzeCSSBundle(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.performAnalysis());
    } else {
      this.performAnalysis();
    }
  }

  private performAnalysis(): void {
    this.analyzeStylesheets();
    this.detectUnusedCSS();
    this.measureRenderTime();
  }

  private analyzeStylesheets(): void {
    const stylesheets = Array.from(document.styleSheets);
    
    stylesheets.forEach((stylesheet) => {
      try {
        if (stylesheet.href) {
          // External stylesheet
          const link = document.querySelector(`link[href*="${stylesheet.href}"]`) as HTMLLinkElement;
          if (link) {
            this.analyzeExternalStylesheet(link);
          }
        } else {
          // Inline stylesheet
          this.analyzeInlineStylesheet(stylesheet);
        }
      } catch (error) {
        // Handle CORS errors for external stylesheets
        console.warn('Could not analyze stylesheet:', error);
      }
    });
  }

  private analyzeExternalStylesheet(link: HTMLLinkElement): void {
    // Check if it's critical CSS (inline or early loaded)
    if (link.media === 'print' || link.rel === 'preload') {
      return;
    }

    // Estimate size based on performance entries
    const perfEntry = performance.getEntriesByName(link.href)[0] as PerformanceResourceTiming;
    if (perfEntry) {
      const size = perfEntry.transferSize || 0;
      if (link.dataset['critical'] === 'true') {
        this.metrics.criticalCSSSize += size;
      }
    }
  }

  private analyzeInlineStylesheet(stylesheet: CSSStyleSheet): void {
    try {
      const rules = Array.from(stylesheet.cssRules || []);
      const cssText = rules.map(rule => rule.cssText).join('');
      const size = new Blob([cssText]).size;
      
      // Assume inline styles are critical
      this.metrics.criticalCSSSize += size;
    } catch (error) {
      // Handle cross-origin restrictions
    }
  }

  private detectUnusedCSS(): void {
    // Use Intersection Observer to detect which elements are visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-in-viewport', 'true');
        }
      });
    });

    // Observe all elements with classes
    document.querySelectorAll('[class]').forEach(el => observer.observe(el));

    // After a delay, analyze unused classes
    setTimeout(() => {
      this.analyzeUnusedClasses();
      observer.disconnect();
    }, 5000);
  }

  private analyzeUnusedClasses(): void {
    const usedClasses = new Set<string>();
    const allElements = document.querySelectorAll('[class]');
    
    allElements.forEach(element => {
      element.classList.forEach(className => {
        usedClasses.add(className);
      });
    });

    // Estimate unused CSS (this is a simplified approach)
    const totalClasses = this.extractAllCSSClasses();
    const unusedClassCount = totalClasses.size - usedClasses.size;
    const unusedPercentage = (unusedClassCount / totalClasses.size) * 100;
    
    this.metrics.unusedCSS = Math.round(unusedPercentage);
  }

  private extractAllCSSClasses(): Set<string> {
    const allClasses = new Set<string>();
    
    try {
      Array.from(document.styleSheets).forEach(stylesheet => {
        try {
          Array.from(stylesheet.cssRules || []).forEach(rule => {
            if (rule instanceof CSSStyleRule) {
              const selectors = rule.selectorText.split(',');
              selectors.forEach(selector => {
                const classMatches = selector.match(/\.[a-zA-Z0-9_-]+/g);
                classMatches?.forEach(match => {
                  allClasses.add(match.substring(1)); // Remove the dot
                });
              });
            }
          });
        } catch (error) {
          // Handle cross-origin restrictions
        }
      });
    } catch (error) {
      console.warn('Could not extract CSS classes:', error);
    }
    
    return allClasses;
  }

  private measureRenderTime(): void {
    // Measure First Contentful Paint and Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.renderTime = entry.startTime;
          }
        }
      });

      paintObserver.observe({ entryTypes: ['paint'] });
    }
  }

  getMetrics(): CSSMetrics {
    return { ...this.metrics };
  }

  getCSSOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    if (this.metrics.unusedCSS > 30) {
      suggestions.push('Consider purging unused CSS - over 30% appears unused');
    }
    
    if (this.metrics.totalStylesheets > 5) {
      suggestions.push('Consider combining CSS files to reduce HTTP requests');
    }
    
    if (this.metrics.totalCSSSize > 100000) {
      suggestions.push('CSS bundle size is large (>100KB) - consider code splitting');
    }
    
    if (this.metrics.criticalCSSSize < this.metrics.totalCSSSize * 0.1) {
      suggestions.push('Consider inlining more critical CSS for faster initial render');
    }
    
    if (this.metrics.loadTime > 500) {
      suggestions.push('CSS load time is slow - consider using a CDN or optimizing delivery');
    }
    
    return suggestions;
  }

  logMetrics(): void {
    if (typeof console !== 'undefined') {
      console.group('🎨 CSS Bundle Performance Metrics');
      console.log('📊 Total Stylesheets:', this.metrics.totalStylesheets);
      console.log('📏 Total CSS Size:', `${(this.metrics.totalCSSSize / 1024).toFixed(2)} KB`);
      console.log('⚡ Critical CSS Size:', `${(this.metrics.criticalCSSSize / 1024).toFixed(2)} KB`);
      console.log('🗑️ Unused CSS:', `${this.metrics.unusedCSS}%`);
      console.log('⏱️ Load Time:', `${this.metrics.loadTime.toFixed(2)}ms`);
      console.log('🎯 Render Time:', `${this.metrics.renderTime.toFixed(2)}ms`);
      
      const suggestions = this.getCSSOptimizationSuggestions();
      if (suggestions.length > 0) {
        console.group('💡 Optimization Suggestions');
        suggestions.forEach(suggestion => console.log('•', suggestion));
        console.groupEnd();
      }
      
      console.groupEnd();
    }
  }

  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }
}
