# Email Templates for Supabase

## 1. CONFIRM SIGNUP TEMPLATE
Copy and paste this into Supabase Dashboard → Authentication → Email Templates → "Confirm signup":

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
            color: white !important;
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
        .backup-link {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
            word-break: break-all;
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
            
            <div class="backup-link">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <p>{{ .ConfirmationURL }}</p>
            </div>
            
            <p><strong>What's next?</strong></p>
            <ul>
                <li>Access your project dashboard</li>
                <li>Manage electrical engineering projects</li>
                <li>Track progress and collaborate with your team</li>
                <li>Upload and review project documents</li>
            </ul>
            
            <p><strong>Security Note:</strong> This link will expire in 24 hours for your security.</p>
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

## 2. RESET PASSWORD TEMPLATE
Copy and paste this into Supabase Dashboard → Authentication → Email Templates → "Reset password":

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
            color: white !important;
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
        .backup-link {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
            word-break: break-all;
        }
        .security-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>GYG Power Systems</h1>
            <p>Password Reset Request</p>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>You've requested to reset your password for your GYG Power Systems account.</p>
            <p>Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
            </div>
            
            <div class="backup-link">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <p>{{ .ConfirmationURL }}</p>
            </div>
            
            <div class="security-note">
                <p><strong>🔒 Security Information:</strong></p>
                <ul>
                    <li>This link will expire in 1 hour for your security</li>
                    <li>You can only use this link once</li>
                    <li>If you didn't request this, please ignore this email</li>
                </ul>
            </div>
            
            <p><strong>Having trouble?</strong></p>
            <p>If you continue to have problems accessing your account, please contact our support team.</p>
            
            <p><strong>Didn't request this?</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
            <p>© 2025 GYG Power Systems. All rights reserved.</p>
            <p>This is an automated email, please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
```

## How to Use These Templates:

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Confirm Signup Template
1. Click on **"Confirm signup"**
2. Delete the existing template
3. Copy and paste the **first template** above
4. Click **Save**

### Step 3: Update Reset Password Template
1. Click on **"Reset password"**
2. Delete the existing template
3. Copy and paste the **second template** above
4. Click **Save**

### Step 4: Verify Settings
Make sure your Supabase settings have:
- **Site URL**: `https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app`
- **Redirect URLs**: Include your `/auth/confirm` and `/auth/reset-password` pages

## Template Features:
✅ **GYG Power Systems branding**
✅ **Responsive design for mobile/desktop**
✅ **Professional orange gradient styling**
✅ **Backup text links if buttons don't work**
✅ **Security information for users**
✅ **Proper Supabase variables** (`{{ .ConfirmationURL }}`)

Both templates are ready to copy-paste directly into Supabase!
