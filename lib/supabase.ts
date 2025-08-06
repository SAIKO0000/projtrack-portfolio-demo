import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Test Supabase connection and log project count
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key (first 20 chars):', supabaseAnonKey.substring(0, 1) + '...');
    
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log('✅ Connection test successful! Project count:', count);
  } catch (err: unknown) {
    console.error('❌ Supabase connection failed:', err);
  }
};

testConnection();

export type Project = Database['public']['Tables']['projects']['Row']
export type Personnel = Database['public']['Tables']['personnel']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type Photo = Database['public']['Tables']['photos']['Row']
