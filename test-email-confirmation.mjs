import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qvoockauodrptvyqqqbe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2b29ja2F1b2RycHR2eXFxcWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTc4NzUsImV4cCI6MjA2ODEzMzg3NX0.GDOQ0x87OtbXC9_Bla0G1BW1yc5Tzi7LAhHRAdeYah4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEmailConfirmation() {
  console.log('🔍 Testing Supabase Email Confirmation Setup...\n')
  
  // Test 1: Check if we can connect to Supabase
  try {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('✅ Supabase connection: OK')
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message)
    return
  }

  // Test 2: Check current auth settings (this will show public settings)
  try {
    const { data: settings } = await supabase.auth.getSettings()
    console.log('✅ Auth settings accessible')
    console.log('Settings:', JSON.stringify(settings, null, 2))
  } catch (error) {
    console.log('⚠️ Could not fetch auth settings (normal for client-side):', error.message)
  }

  // Test 3: Simulate signup with test email
  console.log('\n🧪 Testing signup process with test email...')
  
  const testEmail = `test+${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app/auth/callback'
      }
    })
    
    if (error) {
      console.log('❌ Signup error:', error.message)
      console.log('Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Signup successful!')
      console.log('User ID:', data.user?.id)
      console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No')
      console.log('Confirmation sent:', data.user?.confirmation_sent_at ? 'Yes' : 'No')
      
      if (!data.user?.email_confirmed_at) {
        console.log('📧 Email confirmation required - check if email was sent')
      }
    }
  } catch (error) {
    console.log('❌ Signup failed:', error.message)
  }

  console.log('\n📋 Checklist for email confirmation:')
  console.log('1. Go to Supabase Dashboard > Authentication > Settings')
  console.log('2. Check "Enable email confirmations" is ON')
  console.log('3. Set Site URL to: https://gyg-track-x4ccoazzn-josh01616s-projects.vercel.app')
  console.log('4. Add redirect URLs for production and localhost')
  console.log('5. Check Email Templates are configured')
  console.log('6. Verify SMTP settings if using custom email provider')
}

testEmailConfirmation().catch(console.error)
