# Email Confirmation Redirect Setup

## The Problem
You want the email confirmation link to redirect users to the correct page after they confirm their email.

## How Supabase Email Confirmation Works

### 1. The `{{ .ConfirmationURL }}` Variable
When you use `{{ .ConfirmationURL }}` in your email template, Supabase automatically generates a URL like:
```
https://qvoockauodrptvyqqqbe.supabase.co/auth/v1/verify?token=ABC123&type=signup&redirect_to=YOUR_SITE_URL
```

### 2. The Redirect Flow
1. User clicks email link → Goes to Supabase server
2. Supabase verifies the token → Confirms the email
3. Supabase redirects to your `redirect_to` URL
4. Your app receives the confirmed user

## Configure the Redirect URL

### Step 1: Set Site URL in Supabase
Go to **Supabase Dashboard** → **Authentication** → **Settings**

**Site URL should be:**
```
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app
```

This becomes the default redirect after email confirmation.

### Step 2: Add Redirect URLs
In the same settings, add these **Redirect URLs**:
```
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app/auth/callback
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app/auth/confirm
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app/
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app/dashboard
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/
```

### Step 3: Create Auth Callback Handler
You need a page at `/auth/callback` to handle the redirect:

**File: `app/auth/callback/route.ts`**
```typescript
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to dashboard after successful confirmation
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
```

### Step 4: Update Your Signup Code
In your signup function, specify where to redirect after confirmation:

**File: `lib/auth.tsx`** (update your signUp function):
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      first_name: firstName,
      last_name: lastName,
      company: company,
      role: role,
    },
  },
})
```

## Complete Flow

### What Happens:
1. **User signs up** → Account created, confirmation email sent
2. **User clicks email link** → Goes to Supabase with token
3. **Supabase verifies email** → Marks email as confirmed
4. **Supabase redirects** → To your `/auth/callback` URL
5. **Your callback page** → Exchanges code for session
6. **User redirected** → To dashboard (or wherever you want)

## Custom Redirect Destinations

### Option 1: Always go to Dashboard
```typescript
// In callback route
return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
```

### Option 2: Go to Welcome Page
```typescript
// In callback route  
return NextResponse.redirect(`${requestUrl.origin}/welcome`)
```

### Option 3: Go Back to Homepage with Success Message
```typescript
// In callback route
return NextResponse.redirect(`${requestUrl.origin}/?confirmed=true`)
```

## Testing the Complete Flow

### Test Steps:
1. Update email template with `{{ .ConfirmationURL }}`
2. Set Site URL in Supabase dashboard
3. Add redirect URLs including `/auth/callback`
4. Create the callback route handler
5. Sign up with test email
6. Click confirmation link in email
7. Should redirect to your dashboard

## Current Settings Check

**Your Site URL should be:**
```
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app
```

**Your Redirect URLs should include:**
```
https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app/auth/callback
```

This way, `{{ .ConfirmationURL }}` will automatically redirect to the right place after confirmation!
