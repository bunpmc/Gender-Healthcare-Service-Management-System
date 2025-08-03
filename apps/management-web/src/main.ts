import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  // Use console.error for critical bootstrap errors as LoggerService isn't available yet
  console.error('Failed to bootstrap application:', err);
});
