import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

export interface ErrorPageData {
  type: 'network' | '404' | '500' | 'generic';
  title?: string;
  message?: string;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
}

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule],
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss'],
})
export class ErrorPageComponent implements OnInit, OnDestroy {
  errorData: ErrorPageData = {
    type: 'generic',
    title: '',
    message: '',
    showRetry: true,
    showHome: true,
    showBack: false,
  };

  currentLang = 'vi'; // Current language
  private langChangeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Initialize language
    this.currentLang = localStorage.getItem('lang') || 'vi';
    this.translate.use(this.currentLang);

    // Get error data from route state or query params
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as ErrorPageData;

    if (state) {
      // Error page was navigated to with specific error data
      this.errorData = { ...this.errorData, ...state };
    } else {
      // Check query params for error type
      this.route.queryParams.subscribe((params) => {
        if (params['type']) {
          this.setErrorType(params['type']);
        } else {
          // If no error type specified, check if this is a wildcard route (404)
          const url = this.router.url;
          if (url === '/error') {
            // Direct navigation to /error without parameters - show generic error
            this.setErrorType('generic');
          } else {
            // This is likely a 404 from the wildcard route
            this.setErrorType('404');
          }
        }
      });
    }

    // Set initial content
    this.setErrorContent();

    // Subscribe to language changes
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.setErrorContent();
    });
  }

  ngOnDestroy(): void {
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }

  private setErrorType(type: string): void {
    switch (type) {
      case 'network':
        this.errorData = {
          type: 'network',
          showRetry: true,
          showHome: true,
          showBack: false,
        };
        break;
      case '404':
        this.errorData = {
          type: '404',
          showRetry: false,
          showHome: true,
          showBack: true,
        };
        break;
      case '500':
        this.errorData = {
          type: '500',
          showRetry: true,
          showHome: true,
          showBack: false,
        };
        break;
      default:
        this.errorData = {
          type: 'generic',
          showRetry: true,
          showHome: true,
          showBack: false,
        };
    }
  }

  private setErrorContent(): void {
    // This method is now simplified since we use translation pipes in template
    // We only need to ensure the error type is set correctly
  }

  getErrorTitleKey(): string {
    return `ERROR.${this.errorData.type.toUpperCase()}.TITLE`;
  }

  getErrorMessageKey(): string {
    return `ERROR.${this.errorData.type.toUpperCase()}.MESSAGE`;
  }

  changeLang(lang: string): void {
    if (this.currentLang !== lang) {
      this.currentLang = lang;
      this.translate.use(lang);
      localStorage.setItem('lang', lang);
    }
  }

  onRetry(): void {
    // Try to go back to previous page or reload current page
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.reload();
    }
  }

  onGoHome(): void {
    this.router.navigate(['/']);
  }

  onGoBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  getErrorIcon(): string {
    switch (this.errorData.type) {
      case 'network':
        return 'wifi-off';
      case '404':
        return 'search';
      case '500':
        return 'server-error';
      default:
        return 'alert-triangle';
    }
  }

  getErrorAnimation(): string {
    switch (this.errorData.type) {
      case 'network':
        return 'pulse-animation';
      case '404':
        return 'bounce-animation';
      case '500':
        return 'shake-animation';
      default:
        return 'fade-animation';
    }
  }
}
