import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
// Temporarily commented out until dependencies are properly installed
// import { provideOAuthClient } from 'angular-oauth2-oidc';
// import { providePrimeNG } from 'primeng/config';
// import Aura from '@primeng/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
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
