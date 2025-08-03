import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { LoggerService } from './core/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preloadedModules: string[] = [];

  constructor(private logger: LoggerService) {}

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Only preload routes that are marked for preloading
    if (route.data && route.data['preload']) {
      // Add the route path to our preloaded modules array
      this.preloadedModules.push(route.path || '');
      this.logger.debug('Preloaded: ' + route.path);
      return load();
    } else {
      return of(null);
    }
  }
}
