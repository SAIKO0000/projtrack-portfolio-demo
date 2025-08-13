# Production Deployment Configuration

## Supabase Settings for Production

### 1. Update Supabase Auth Settings

In your Supabase Dashboard (https://supabase.com/dashboard):

1. Go to **Project Settings** → **API**
2. Note your:
   - Project URL: `https://your-project.supabase.co`
   - Anon key: `your-anon-key`
   - Service role key: `your-service-role-key`

### 2. Configure Authentication Settings

Go to **Authentication** → **Settings**:

#### Site URL:
```
https://gyg-track.vercel.app
```

#### Redirect URLs:
Add these URLs to your redirect URLs list:
```
https://gyg-track.vercel.app/auth/callback
https://gyg-track.vercel.app/auth/confirm
https://gyg-track.vercel.app/auth/reset-password
https://gyg-track.vercel.app/
```

#### For development, also keep:
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/auth/reset-password
http://localhost:3000/
```

### 3. Environment Variables for Vercel

In your Vercel dashboard, add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Email Template URLs

Update the email templates to use the correct domain:

#### Confirmation Email:
- Replace `{{ .ConfirmationURL }}` references in templates
- Will automatically use: `https://gyg-track.vercel.app/auth/confirm`

#### Password Reset Email:
- Replace `{{ .ConfirmationURL }}` references in templates  
- Will automatically use: `https://gyg-track.vercel.app/auth/reset-password`

### 5. Testing Production URLs

Test these flows in production:

1. **Sign Up**: User should receive email with `https://gyg-track.vercel.app/auth/confirm?token=...`
2. **Password Reset**: User should receive email with `https://gyg-track.vercel.app/auth/reset-password?token=...`
3. **Email Confirmation**: After clicking link, user should be redirected to your app

### 6. Domain Configuration (Optional)

If you want to use a custom domain:

1. Configure custom domain in Vercel
2. Update all URLs above to use your custom domain
3. Update Supabase settings accordingly

### 7. Monitoring and Debugging

- Check Vercel deployment logs for any errors
- Monitor Supabase Auth logs for authentication issues
- Test email delivery in production
- Verify all redirect URLs work correctly

## Deployment Checklist

- [ ] Supabase Site URL updated to production domain
- [ ] All redirect URLs added to Supabase
- [ ] Environment variables set in Vercel
- [ ] Email templates updated with custom branding
- [ ] Authentication flows tested in production
- [ ] Remember Me functionality tested
- [ ] Password reset flow tested
- [ ] Email confirmation flow tested
