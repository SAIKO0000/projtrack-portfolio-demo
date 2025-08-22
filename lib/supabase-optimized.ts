// Unified Supabase client configuration for optimal performance
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Single optimized Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'projtrack-auth-optimized',
    // Reduce auth refresh frequency - using flowType instead of deprecated autoRefreshSeconds
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 1, // Reduced from default 2
      // Only connect to realtime when needed
      heartbeatIntervalMs: 30000, // 30 seconds instead of 15
      reconnectAfterMs: () => 5000 // Fixed 5s reconnect delay
    }
  },
  global: {
    headers: {
      'x-application-name': 'ProjTrack-Optimized',
      'x-client-info': 'projtrack@1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
})

// Performance tracking in development
if (process.env.NODE_ENV === 'development') {
  // Track request counts
  const originalFrom = supabase.from.bind(supabase)
  const requestCounts: Record<string, number> = {}
  
  supabase.from = function(table: string) {
    requestCounts[table] = (requestCounts[table] || 0) + 1
    console.log(`📊 DB Request Count - ${table}: ${requestCounts[table]}`)
    return originalFrom(table)
  }
  
  // Log total requests every 30 seconds
  setInterval(() => {
    const total = Object.values(requestCounts).reduce((sum, count) => sum + count, 0)
    
    // Only log in development and when there are significant requests
    if (process.env.NODE_ENV === 'development' && total > 50) {
      console.warn('⚠️ High DB request count detected:', total, requestCounts)
    }
  }, 30000)
}

// Connection health check with optimized error handling
const testConnection = async () => {
  try {
    console.log('🔍 Testing optimized Supabase connection...')
    
    const { count, error } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    
    if (error) throw error
    console.log('✅ Optimized connection successful! Project count:', count)
  } catch (err) {
    console.error('❌ Optimized connection failed:', err)
  }
}

// Only test connection in development
if (process.env.NODE_ENV === 'development') {
  testConnection()
}

// Type definitions (to be replaced with proper database types later)
export type Project = Record<string, unknown>
export type Personnel = Record<string, unknown>
export type Task = Record<string, unknown>
export type Event = Record<string, unknown>
export type Report = Record<string, unknown>
export type Photo = Record<string, unknown>
