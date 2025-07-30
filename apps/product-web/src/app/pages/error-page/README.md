# Error Page System

This error page system provides a comprehensive solution for handling various types of errors in the Angular application, including network failures, 404 errors, server errors, and generic application errors.

## Features

- **Hospital-friendly design** with medical-themed illustrations
- **Multiple error types** (Network, 404, Server, Generic)
- **Animated icons** for better user experience
- **Multilingual support** (English and Vietnamese)
- **Responsive design** for all device sizes
- **Automatic error handling** via interceptors
- **Manual error navigation** via services and utilities

## Error Types

### 1. Network Error (`type: 'network'`)
- Triggered when there's no internet connection
- Shows retry button and home button
- Animated pulse icon

### 2. 404 Error (`type: '404'`)
- Triggered when a page is not found
- Shows home and back buttons
- Animated bounce icon

### 3. Server Error (`type: '500'`)
- Triggered for server-side errors (5xx status codes)
- Shows retry and home buttons
- Animated shake icon

### 4. Generic Error (`type: 'generic'`)
- Default error type for unexpected errors
- Customizable title and message
- Animated fade icon

## Usage

### Automatic Error Handling

The system automatically handles errors through:

1. **Global Error Handler** - Catches unhandled JavaScript errors
2. **HTTP Interceptor** - Catches HTTP errors from API calls
3. **Network Monitoring** - Detects when user goes offline

### Manual Error Navigation

#### Using ErrorHandlerService

```typescript
import { ErrorHandlerService } from './services/error-handler.service';

constructor(private errorHandler: ErrorHandlerService) {}

// Navigate to specific error type
this.errorHandler.navigateToNetworkError();
this.errorHandler.navigateTo404();
this.errorHandler.navigateToServerError();

// Navigate with custom options
this.errorHandler.navigateToError({
  type: 'generic',
  title: 'Custom Title',
  message: 'Custom message',
  showRetry: true,
  showHome: true,
  showBack: false
});
```

#### Using ErrorNavigationUtil

```typescript
import { ErrorNavigationUtil } from './utils/error-navigation.util';

constructor(private router: Router) {}

// Quick navigation methods
ErrorNavigationUtil.navigateToNetworkError(this.router);
ErrorNavigationUtil.navigateTo404(this.router);
ErrorNavigationUtil.navigateToServerError(this.router);
ErrorNavigationUtil.navigateToGenericError(this.router, 'Custom message');

// Handle HTTP errors automatically
ErrorNavigationUtil.handleHttpError(this.router, error);
```

### Component Error Handling

```typescript
// In your component
someApiCall().subscribe({
  next: (data) => {
    // Handle success
  },
  error: (error) => {
    // Let the interceptor handle it automatically, or handle manually:
    if (error.status === 404) {
      ErrorNavigationUtil.navigateTo404(this.router);
    } else {
      ErrorNavigationUtil.handleHttpError(this.router, error);
    }
  }
});
```

## Routing

The error page is configured with these routes:

```typescript
{
  path: 'error',
  component: ErrorPageComponent,
  data: { breadcrumb: 'Error' },
},
{
  path: '**',  // Wildcard route for 404
  component: ErrorPageComponent,
  data: { breadcrumb: 'Page Not Found' },
}
```

## Translations

Error messages are stored in translation files:

**English (`public/i18n/en.json`)**
```json
{
  "ERROR": {
    "NETWORK": {
      "TITLE": "Connection Problem",
      "MESSAGE": "We're having trouble connecting..."
    },
    "404": {
      "TITLE": "Page Not Found",
      "MESSAGE": "The page you're looking for..."
    }
    // ... more translations
  }
}
```

**Vietnamese (`public/i18n/vi.json`)**
```json
{
  "ERROR": {
    "NETWORK": {
      "TITLE": "Lỗi Kết Nối",
      "MESSAGE": "Chúng tôi đang gặp sự cố..."
    }
    // ... more translations
  }
}
```

## Customization

### Adding New Error Types

1. Add new error type to `ErrorPageData` interface
2. Add corresponding translations
3. Add new icon and animation in the template
4. Update the `getErrorIcon()` and `getErrorAnimation()` methods

### Styling

The error page uses:
- **Primary color**: `#4E6688` (hospital blue-gray)
- **Background**: Gradient from blue-50 to indigo-100
- **Animations**: CSS keyframes for different error types
- **Responsive**: Tailwind CSS classes

### Medical Theme

The design includes:
- Medical cross pattern in header
- Stethoscope illustration
- Heartbeat line animation
- Hospital-friendly color scheme
- Professional typography

## Testing

To test the error page system:

1. Use the `ErrorDemoComponent` for manual testing
2. Disconnect internet to test network errors
3. Navigate to non-existent routes for 404 testing
4. Simulate server errors in development

## Browser Support

- Modern browsers with ES6+ support
- Progressive enhancement for older browsers
- Graceful fallbacks for unsupported features
