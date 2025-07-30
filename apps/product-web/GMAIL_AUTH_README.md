# Gmail Authentication System

This system provides complete Gmail-based authentication with OTP verification for both sign-up and sign-in.

## Features

- ✅ Gmail-only authentication (validates @gmail.com addresses)
- ✅ OTP verification via email
- ✅ Secure password setup for new accounts
- ✅ Session management with Supabase
- ✅ Patient profile creation
- ✅ Responsive UI with loading states
- ✅ Form validation and error handling

## Architecture

### Backend (Supabase Edge Functions)

1. **`otp-auth-gmail`** - Sends OTP to Gmail addresses
2. **`verify-otp-gmail`** - Verifies OTP and handles account creation

### Frontend (Angular)

1. **`GmailAuthService`** - Handles API calls and state management
2. **`GmailAuthComponent`** - Multi-step authentication UI
3. **`GmailLoginPageComponent`** - Full-page login experience

## Setup Instructions

### 1. Deploy Edge Functions

```bash
# Deploy the OTP sending function (already exists)
supabase functions deploy otp-auth-gmail

# Deploy the OTP verification function
supabase functions deploy verify-otp-gmail
```

### 2. Configure Supabase

Ensure your Supabase project has:
- Auth enabled with email provider
- `patients` table for user profiles
- Proper RLS policies

### 3. Environment Variables

Make sure these are set in your Supabase project:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Frontend Integration

Add to your Angular app:

```typescript
// In your routing
{ path: 'gmail-login', component: GmailLoginPageComponent }

// In your component
import { GmailAuthComponent } from './components/gmail-auth/gmail-auth.component';

// Usage
<app-gmail-auth
  (authSuccess)="onAuthSuccess($event)"
  (authCancel)="onAuthCancel()"
></app-gmail-auth>
```

## API Endpoints

### Send OTP
```
POST https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/otp-auth-gmail
```

**Request:**
```json
{
  "email": "user@gmail.com",
  "action": "sign-up" | "sign-in"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your Gmail for sign-up (expires in 15 minutes)"
}
```

### Verify OTP
```
POST https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/verify-otp-gmail
```

**Request:**
```json
{
  "email": "user@gmail.com",
  "token": "123456",
  "action": "sign-up" | "sign-in",
  "password": "securePassword123!" // Required for sign-up
}
```

**Response (Sign-in):**
```json
{
  "success": true,
  "message": "Sign-in successful",
  "user": { ... },
  "session": { ... },
  "profile": { ... }
}
```

**Response (Sign-up):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": { ... },
  "requiresSignIn": true
}
```

## User Flow

### Sign Up Flow
1. User enters Gmail address
2. System sends OTP to email
3. User enters 6-digit OTP
4. User creates password
5. System verifies OTP + creates account
6. User must sign in with email/password

### Sign In Flow
1. User enters Gmail address
2. System sends OTP to email
3. User enters 6-digit OTP
4. System verifies OTP + creates session
5. User is authenticated

## Security Features

- Gmail address validation
- OTP expiration (15 minutes)
- Password strength requirements
- Session management
- Error handling and rate limiting
- Secure token storage

## Password Requirements

- Minimum 6 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character (@$!%*?&)

## Error Handling

The system handles various error scenarios:
- Invalid Gmail addresses
- Expired or invalid OTPs
- Weak passwords
- Network errors
- Server errors

## Customization

### Styling
Modify the CSS in `GmailAuthComponent` to match your design system.

### Validation
Update password requirements in `GmailAuthService.validatePassword()`.

### Flow
Customize the authentication flow by modifying the step logic in `GmailAuthComponent`.

## Testing

1. Test with valid Gmail addresses
2. Test OTP expiration
3. Test password validation
4. Test error scenarios
5. Test responsive design

## Troubleshooting

### Common Issues

1. **OTP not received**: Check spam folder, verify Gmail address
2. **Invalid OTP**: Ensure 6-digit format, check expiration
3. **Password rejected**: Review password requirements
4. **Session issues**: Check Supabase configuration

### Debug Mode

Enable console logging in development:
```typescript
console.log('Gmail auth debug:', response);
```

## Production Considerations

1. Configure proper CORS settings
2. Set up monitoring and logging
3. Implement rate limiting
4. Configure email templates
5. Set up proper error tracking
6. Test thoroughly across devices

## Support

For issues or questions:
1. Check the console for error messages
2. Verify Supabase configuration
3. Test edge functions directly
4. Review network requests in browser dev tools
