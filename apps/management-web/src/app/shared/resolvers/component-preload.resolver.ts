import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of, delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComponentPreloadResolver implements Resolve<boolean> {
  resolve(): Observable<boolean> {
    // Simulate component loading time
    return of(true).pipe(delay(100));
  }
}
