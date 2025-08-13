# Supabase Email Template Customization Guide

## Overview
This guide explains how to customize the default Supabase authentication emails for better branding and user experience.

## Current Issues
1. **Generic confirmation message**: "Confirm your signup" with basic styling
2. **Wrong redirect URL**: Users are redirected to `http://localhost:3000/` instead of a proper confirmation page
3. **Default reset password message**: Basic HTML without branding

## How to Customize Email Templates

### 1. Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### 2. Customize Confirmation Email Template

Replace the default template with:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to GYG Power Systems</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ea580c, #f97316);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #ea580c, #f97316);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background: #f1f5f9;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to GYG Power Systems</h1>
            <p>Project Management Platform</p>
        </div>
        <div class="content">
            <h2>Confirm Your Email Address</h2>
            <p>Thank you for signing up for GYG Power Systems Project Management Platform!</p>
            <p>To complete your registration and access your dashboard, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
            </div>
            
            <p><strong>What's next?</strong></p>
            <ul>
                <li>Access your project dashboard</li>
                <li>Manage electrical engineering projects</li>
                <li>Track progress and collaborate with your team</li>
                <li>Upload and review project documents</li>
            </ul>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2025 GYG Power Systems. All rights reserved.</p>
            <p>This is an automated email, please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
```

### 3. Customize Password Reset Email Template

Replace the default template with:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Your Password - GYG Power Systems</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ea580c, #f97316);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #ea580c, #f97316);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .warning-box {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background: #f1f5f9;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
            <p>GYG Power Systems</p>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>You recently requested to reset your password for your GYG Power Systems account.</p>
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
            </div>
            
            <div class="warning-box">
                <p><strong>Security Notice:</strong></p>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will not change until you create a new one</li>
                </ul>
            </div>
            
            <p>For security reasons, if you continue to have trouble accessing your account, please contact our support team.</p>
        </div>
        <div class="footer">
            <p>© 2025 GYG Power Systems. All rights reserved.</p>
            <p>This is an automated email, please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
```

### 4. Update Site URL Settings

In your Supabase dashboard:

1. Go to **Authentication** → **Settings**
2. Update **Site URL** to: `https://gyg-track.vercel.app` (production) or `http://localhost:3000` (development)
3. Update **Redirect URLs** to include:
   - `https://gyg-track.vercel.app/auth/confirm`
   - `https://gyg-track.vercel.app/auth/reset-password`
   - `https://gyg-track.vercel.app/auth/callback`
   - `http://localhost:3000/auth/confirm` (for development)
   - `http://localhost:3000/auth/reset-password` (for development)
   - `http://localhost:3000/auth/callback` (for development)

### 5. Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the Email Templates

### Development Testing:
1. Sign up with a new email address
2. Check your email for the customized confirmation message
3. Click the confirmation link to test the `/auth/confirm` page
4. Test password reset flow with `/auth/forgot-password`

### Production Setup:
1. Update Site URL to `https://gyg-track.vercel.app`
2. Configure custom SMTP settings (optional) in Supabase
3. Test all email flows in production environment

## Quick Setup for GYG Track

### Immediate Steps for https://gyg-track.vercel.app:

1. **Supabase Dashboard Configuration**:
   - Site URL: `https://gyg-track.vercel.app`
   - Redirect URLs: Add all the URLs listed in section 4 above

2. **Email Template Testing**:
   - Users will receive confirmation emails with links to `https://gyg-track.vercel.app/auth/confirm`
   - Password reset emails will link to `https://gyg-track.vercel.app/auth/reset-password`

3. **Login Page Features**:
   - Added "Remember" checkbox that saves email and password locally
   - Credentials are automatically filled on return visits
   - Secure local storage implementation

## Customization Options

You can further customize:
- **Colors**: Update the gradient colors to match your brand
- **Logo**: Add your company logo to the email header
- **Content**: Modify the messaging and instructions
- **Styling**: Adjust fonts, spacing, and layout
- **SMTP Provider**: Use your own email service (SendGrid, Mailgun, etc.)

## Notes
- Changes to email templates are applied immediately
- Test thoroughly in development before deploying to production
- Consider setting up a custom domain for professional email sending
- Monitor email delivery rates and spam folders during testing
