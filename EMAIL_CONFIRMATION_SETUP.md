# Email Confirmation Setup for Vercel Deployment

## Overview
This guide explains how to set up email confirmation for your GYG Power Systems app deployed at https://gyg-track.vercel.app/

## Steps to Configure in Supabase Dashboard

### 1. Configure Site URL
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **General**
3. Set the **Site URL** to: `https://gyg-track.vercel.app`

### 2. Configure Redirect URLs
1. In the same **General** settings page
2. Add the following **Redirect URLs**:
   - `https://gyg-track.vercel.app/auth/confirm`
   - `https://gyg-track.vercel.app/auth/login`
   - `https://gyg-track.vercel.app/auth/signup`

### 3. Configure Email Templates
1. Navigate to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Replace the default template with the content from `email-templates/confirm-signup.html`
4. Make sure the **Confirmation URL** redirects to: `https://gyg-track.vercel.app/auth/confirm`

### 4. Configure Authentication Settings
1. Go to **Authentication** → **Settings**
2. Under **User Management**:
   - ✅ Enable email confirmations
   - ✅ Enable email change confirmations
   - Set **Minimum password length** as desired (e.g., 6)

### 5. Test the Email Flow
1. Sign up with a test email at https://gyg-track.vercel.app/auth/signup
2. Check your email for the confirmation message
3. Click the confirmation link
4. Verify you're redirected to the confirmation page
5. Verify automatic redirect to login after 3 seconds

## Email Template Variables Available
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Year }}` - Current year
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

## Confirmation Page Features
The `/auth/confirm` page includes:
- ✅ Automatic email verification
- ✅ Success/error status handling
- ✅ Auto-redirect to login after success
- ✅ Error handling with helpful messages
- ✅ Mobile-responsive design
- ✅ Consistent branding with your app

## Troubleshooting
1. **Confirmation fails**: Check that the token_hash and type parameters are correctly passed
2. **Wrong redirect**: Verify the Site URL and Redirect URLs in Supabase settings
3. **Email not received**: Check spam folder and verify email provider settings
4. **Link expired**: Confirmation links expire in 24 hours by default

## Security Notes
- Confirmation links expire automatically
- Invalid links show appropriate error messages
- Users can request new confirmation emails if needed
- All redirects are validated against your configured URLs
