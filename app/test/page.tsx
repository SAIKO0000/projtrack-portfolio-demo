// Test Supabase connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test basic connection
supabase
  .from('projects')
  .select('count', { count: 'exact', head: true })
  .then(({ data, error, count }) => {
    if (error) {
      console.error('❌ Connection test failed:', error)
    } else {
      console.log('✅ Connection test successful! Project count:', count)
    }
  })
  .catch(err => {
    console.error('❌ Connection test error:', err)
  })

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <p>Check the browser console for connection test results.</p>
    </div>
  )
}
