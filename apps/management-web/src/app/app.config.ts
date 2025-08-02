import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { SelectivePreloadingStrategy } from './selective-preloading-strategy.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
// Temporarily commented out until dependencies are properly installed
// import { provideOAuthClient } from 'angular-oauth2-oidc';
// import { providePrimeNG } from 'primeng/config';
// import Aura from '@primeng/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    // Temporarily commented out until dependencies are properly installed
    // provideOAuthClient(),
    provideAnimationsAsync(),
    // providePrimeNG({
    //   theme: {
    //     preset: Aura,
    //   },
    // }),
  ],
};
