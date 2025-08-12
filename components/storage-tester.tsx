"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function StorageTester() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testStorage = async () => {
    setLoading(true)
    try {
      // Test if the profile-pictures bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        setResult(`Error listing buckets: ${bucketsError.message}`)
        return
      }

      const profilePicturesBucket = buckets.find(bucket => bucket.name === 'profile-pictures')
      
      if (!profilePicturesBucket) {
        setResult('❌ profile-pictures bucket does not exist. Please run the SQL script to create it.')
        return
      }

      // Test listing files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('profile-pictures')
        .list()

      if (filesError) {
        setResult(`❌ Error accessing profile-pictures bucket: ${filesError.message}`)
        return
      }

      setResult(`✅ profile-pictures bucket exists and is accessible. Contains ${files.length} files.`)
      
    } catch (error) {
      setResult(`❌ Unexpected error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold">Storage Bucket Tester</h3>
      <Button onClick={testStorage} disabled={loading}>
        {loading ? 'Testing...' : 'Test Profile Pictures Storage'}
      </Button>
      {result && (
        <div className={`p-3 rounded text-sm ${result.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result}
        </div>
      )}
    </div>
  )
}
