# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your healthcare application.

## Prerequisites

1. Google Cloud Console account
2. Supabase project
3. Domain/localhost for testing

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - App name: "Healthcare Management System"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (for development)

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - Name: "Healthcare Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:4200` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:4200/gmail-login` (for development)
     - `https://yourdomain.com/gmail-login` (for production)

5. **Copy the Client ID** - you'll need this!

## Step 2: Update Your Application

### 2.1 Configure Google Client ID

Update the Google Client ID in your service:

```typescript
// src/app/services/google-oauth.service.ts
private readonly GOOGLE_CLIENT_ID = 'YOUR_ACTUAL_GOOGLE_CLIENT_ID_HERE';
```

### 2.2 Environment Configuration

Add to your environment files:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID_HERE',
  // ... other config
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID_HERE',
  // ... other config
};
```

Then update the service to use environment:

```typescript
// src/app/services/google-oauth.service.ts
import { environment } from '../../environments/environment';

private readonly GOOGLE_CLIENT_ID = environment.googleClientId;
```

## Step 3: Deploy Supabase Edge Function

Deploy the Google authentication edge function:

```bash
supabase functions deploy google-auth
```

## Step 4: Configure Supabase

### 4.1 Update Edge Function (Optional)

If you want to verify the Google Client ID in your edge function, update:

```typescript
// supabase/functions/google-auth/index.ts
// Uncomment and update this line:
if (tokenInfo.aud !== 'YOUR_GOOGLE_CLIENT_ID') {
  throw new Error('Token audience mismatch');
}
```

### 4.2 Database Schema

Ensure your `patients` table can handle Google user data:

```sql
-- Add columns if they don't exist
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS image_link TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;
```

## Step 5: Testing

### 5.1 Development Testing

1. Start your Angular dev server: `ng serve`
2. Navigate to `http://localhost:4200/gmail-login`
3. Test both Google OAuth and OTP methods
4. Check browser console for any errors

### 5.2 Production Testing

1. Deploy your application
2. Update Google Cloud Console with production URLs
3. Test with real users

## Step 6: Security Considerations

### 6.1 Domain Verification

- Verify your domain in Google Cloud Console
- Only add trusted domains to authorized origins

### 6.2 Token Validation

- The edge function validates Google tokens server-side
- Never trust client-side token validation alone

### 6.3 User Data

- Only request necessary scopes (email, profile)
- Store minimal user data
- Implement proper data retention policies

## Troubleshooting

### Common Issues

1. **"Invalid Client ID"**
   - Check that your Client ID is correct
   - Ensure the domain is authorized in Google Cloud Console

2. **"Popup blocked"**
   - Modern browsers may block popups
   - The component falls back to redirect flow

3. **"Token verification failed"**
   - Check your edge function logs
   - Ensure Google APIs are accessible from Supabase

4. **"CORS errors"**
   - Add your domain to authorized origins
   - Check Supabase CORS settings

### Debug Mode

Enable debug logging:

```typescript
// In your component
console.log('Google auth debug:', event);
```

## Production Checklist

- [ ] Google Cloud Console configured with production domain
- [ ] Client ID updated in environment files
- [ ] Edge function deployed
- [ ] Database schema updated
- [ ] SSL certificate installed
- [ ] CORS properly configured
- [ ] Error handling tested
- [ ] User flow tested end-to-end

## Support

For issues:
1. Check browser console for errors
2. Check Supabase edge function logs
3. Verify Google Cloud Console configuration
4. Test with different browsers/devices

## API Reference

### Google OAuth Service Methods

```typescript
// Sign in with Google
signInWithGoogle(): Promise<void>

// Render Google button
renderGoogleButton(elementId: string, options?: any): void

// Check if loaded
isLoaded(): boolean

// Sign out
signOut(): void
```

### Component Usage

```html
<app-google-signin
  buttonText="Continue with Google"
  [showGoogleButton]="true"
  (authSuccess)="onSuccess($event)"
  (authError)="onError($event)"
></app-google-signin>
```
