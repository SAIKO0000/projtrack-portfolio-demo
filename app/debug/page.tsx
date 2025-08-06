"use client"

import React from 'react'
import { createClient } from '@supabase/supabase-js'

async function debugSupabaseConnection() {
  console.log('🔍 Starting Supabase connection debugging...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Environment variables:')
  console.log('- URL:', supabaseUrl)
  console.log('- Key available:', !!supabaseAnonKey)
  console.log('- Key prefix:', supabaseAnonKey?.substring(0, 20) + '...')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('📡 Testing basic connection...')
    
    // Test 1: Simple health check
    const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Health check response:', healthCheck.status, healthCheck.statusText)
    
    // Test 2: Try to access a simple table
    console.log('📊 Testing projects table access...')
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1)
    
    if (projectError) {
      console.error('❌ Projects table error:', projectError)
    } else {
      console.log('✅ Projects table accessible, found:', projects?.length || 0, 'records')
    }
    
    // Test 3: Try to access tasks table
    console.log('📋 Testing tasks table access...')
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title')
      .limit(1)
    
    if (tasksError) {
      console.error('❌ Tasks table error:', tasksError)
    } else {
      console.log('✅ Tasks table accessible, found:', tasks?.length || 0, 'records')
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
  }
}

export default function DebugPage() {
  // Run the debug on component mount
  React.useEffect(() => {
    debugSupabaseConnection()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Debug</h1>
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">
          Check the browser console for detailed debugging information.
        </p>
        <p className="text-sm text-gray-600">
          This page will test the Supabase connection and show any issues.
        </p>
      </div>
      
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Common Issues:</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Supabase instance paused (free tier limitation)</li>
          <li>Incorrect environment variables</li>
          <li>Network connectivity issues</li>
          <li>Database tables not created</li>
          <li>Row Level Security (RLS) blocking access</li>
        </ul>
      </div>
    </div>
  )
}
