// Debug script to check Supabase auth configuration
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qvoockauodrptvyqqqbe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2b29ja2F1b2RycHR2eXFxcWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTc4NzUsImV4cCI6MjA2ODEzMzg3NX0.GDOQ0x87OtbXC9_Bla0G1BW1yc5Tzi7LAhHRAdeYah4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAuth() {
  console.log('🔍 Debugging Supabase Auth Configuration...\n')
  
  try {
    // Test signup with confirmation
    console.log('Testing signup with a test email...')
    const { data, error } = await supabase.auth.signUp({
      email: 'test+debug@example.com',
      password: 'testpassword123',
      options: {
        data: {
          name: 'Test User',
          position: 'Debug Test'
        }
      }
    })
    
    if (error) {
      console.error('❌ Signup Error:', error.message)
      return
    }
    
    console.log('✅ Signup successful!')
    console.log('📧 User object:', {
      id: data.user?.id,
      email: data.user?.email,
      email_confirmed_at: data.user?.email_confirmed_at,
      confirmation_sent_at: data.user?.confirmation_sent_at
    })
    
    if (!data.user?.email_confirmed_at && data.user?.confirmation_sent_at) {
      console.log('✅ Confirmation email should have been sent!')
      console.log('📅 Sent at:', data.user.confirmation_sent_at)
    } else if (!data.user?.email_confirmed_at && !data.user?.confirmation_sent_at) {
      console.log('⚠️  Email confirmation is disabled or failed to send')
    } else {
      console.log('✅ Email is already confirmed')
    }
    
  } catch (err) {
    console.error('❌ Debug failed:', err)
  }
}

debugAuth()
