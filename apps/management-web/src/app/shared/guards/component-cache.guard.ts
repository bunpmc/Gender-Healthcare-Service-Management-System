import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

interface CachedComponent {
  path: string;
  timestamp: number;
  component: any;
}

@Injectable({
  providedIn: 'root'
})
export class ComponentCacheGuard implements CanActivate {
  private componentCache = new Map<string, CachedComponent>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private router: Router) {}

  canActivate(route: any): Observable<boolean> {
    const routePath = route.routeConfig?.path;
    
    if (routePath) {
      const cached = this.componentCache.get(routePath);
      const now = Date.now();
      
      // Check if we have a valid cached version
      if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
        console.log(`Using cached component for: ${routePath}`);
        return of(true);
      }
      
      // Cache the component access
      this.componentCache.set(routePath, {
        path: routePath,
        timestamp: now,
        component: route.component
      });
      
      console.log(`Caching component for: ${routePath}`);
    }
    
    return of(true);
  }

  clearCache(): void {
    this.componentCache.clear();
    console.log('Component cache cleared');
  }

  getCacheSize(): number {
    return this.componentCache.size;
  }
}
