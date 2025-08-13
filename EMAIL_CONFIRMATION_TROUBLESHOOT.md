# Email Confirmation Troubleshooting Guide

## Issue: Confirmation emails not being sent after signup

### Most Common Causes & Solutions:

## 1. **Check Supabase Email Settings** (Most Likely Cause)

Go to your Supabase Dashboard:
1. Navigate to **Authentication** → **Settings**
2. Check the **Email** section:

### Required Settings:
- ✅ **Enable email confirmations**: Must be ON
- ✅ **Site URL**: Set to your production domain
- ✅ **Redirect URLs**: Include all your auth callback URLs

### Current Settings for Production:
```
Site URL: https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app

Redirect URLs (Add all of these):
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app/auth/callback
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app/auth/confirm  
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app/
http://localhost:3000/auth/callback (for development)
http://localhost:3000/auth/confirm (for development)
http://localhost:3000/ (for development)
```

## 2. **Email Provider Issues**

### Check Email Provider Status:
- Supabase uses **Resend** for emails by default
- Free tier has limitations (200 emails/month)
- Check if you've exceeded the limit

### Solution: Configure Custom SMTP (Recommended)
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure with your email provider:

#### Gmail SMTP Example:
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: your-app-password (not regular password)
Sender Name: GYG Power Systems
Sender Email: your-email@gmail.com
```

#### Outlook/Office365 SMTP:
```
Host: smtp-mail.outlook.com
Port: 587
Username: your-email@outlook.com
Password: your-password
```

## 3. **Template Configuration**

### Email Templates Location:
Go to **Authentication** → **Email Templates**

### Confirmation Email Template:
Make sure the template includes:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
```

### Current Issues with Default Template:
- Generic branding
- Redirects to localhost:3000

### Custom Template for Your App:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Confirm Your Account - GYG Power Systems</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316;">GYG Power Systems</h1>
            <h2 style="color: #333;">Welcome to Our Project Tracking System!</h2>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p>Thank you for joining our electrical engineering team management platform.</p>
            <p>To complete your registration and start managing projects, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" 
                   style="background: linear-gradient(to right, #f97316, #ea580c); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: bold;">
                    Confirm Your Account
                </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
            </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666;">
            <p>You're receiving this email because you signed up for GYG Power Systems Project Tracking.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
```

## 4. **Environment Variables Check**

Verify your production environment has the correct Supabase URL:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://qvoockauodrptvyqqqbe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. **Testing Steps**

### Test Locally:
1. Run `npm run dev`
2. Sign up with a test email
3. Check browser console for errors
4. Check Supabase logs

### Test in Production:
1. Go to your production URL
2. Sign up with a real email address
3. Check spam/junk folder
4. Check Supabase dashboard logs

## 6. **Debugging Commands**

### Check Supabase Logs:
1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Auth Logs**
3. Look for signup events and email sending logs

### Check Network Tab:
1. Open browser DevTools
2. Go to Network tab
3. Sign up and check the `/auth/signup` request
4. Look for any errors in the response

## 7. **Common Error Messages**

### "Email not confirmed"
- User exists but email not verified
- Check if confirmation email was sent

### "Invalid email"
- Email format validation failed
- Check email format

### "User already registered"
- Email already exists in system
- User may need to use password reset instead

## 8. **Quick Fix Steps**

### Immediate Actions:
1. ✅ Check Supabase email confirmation is enabled
2. ✅ Update Site URL to production domain
3. ✅ Add all redirect URLs
4. ✅ Test with a fresh email address
5. ✅ Check spam folder
6. ✅ Configure custom SMTP if using free tier

### If Still Not Working:
1. Enable email confirmation in Supabase dashboard
2. Configure custom SMTP provider
3. Update email templates with proper branding
4. Test with multiple email addresses
5. Check Supabase usage limits

## 9. **Contact Support**

If none of the above works:
1. Check Supabase status page
2. Contact Supabase support with your project reference
3. Provide error logs and configuration details

---

**Next Steps**: Start with #1 (Supabase Email Settings) as this is the most common cause.
