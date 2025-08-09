"use client"

// Test Supabase connection
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Bell, TestTube } from 'lucide-react'

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
  .then(({ error, count }) => {
    if (error) {
      console.error('❌ Connection test failed:', error)
    } else {
      console.log('✅ Connection test successful! Project count:', count)
    }
  })

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 ProjTrack Testing Center</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Database Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Database Connection Test
              </CardTitle>
              <CardDescription>
                Test Supabase database connectivity and basic queries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Check the browser console for connection test results.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <strong>Expected in console:</strong><br/>
                ✅ Connection test successful! Project count: X
              </div>
            </CardContent>
          </Card>

          {/* Notification Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Notification Testing
              </CardTitle>
              <CardDescription>
                Test individual task deadline notifications (works without login)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test the exact notification format you requested with real or mock task data.
              </p>
              <Link href="/test-notifications">
                <Button className="w-full" variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  Open Notification Test Lab
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>
              Direct links to testing tools and utilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/test-notifications">
                <Button size="sm" variant="outline">
                  🔔 Test Notifications
                </Button>
              </Link>
              <Link href="/debug">
                <Button size="sm" variant="outline">
                  🐛 Debug Page
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                🔄 Refresh Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
