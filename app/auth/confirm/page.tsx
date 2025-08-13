"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function ConfirmPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get URL parameters
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token) {
          setStatus('error')
          setMessage('Invalid confirmation link')
          return
        }

        // Verify the user
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: (type as 'signup' | 'recovery' | 'invite' | 'magiclink') || 'signup'
        })

        if (error) {
          setStatus('error')
          setMessage(error.message || 'Email confirmation failed')
          return
        }

        if (data.user) {
          setStatus('success')
          setMessage('Your email has been confirmed successfully!')
          
          // Auto-redirect to the main app after 3 seconds
          setTimeout(() => {
            router.push('/')
          }, 3000)
        }
      } catch (error) {
        setStatus('error')
        setMessage('An unexpected error occurred')
        console.error('Confirmation error:', error)
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Confirming Email</CardTitle>
              <CardDescription>
                Please wait while we confirm your email address...
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Email Confirmed!</CardTitle>
              <CardDescription>
                Welcome to GYG Power Systems Project Management
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Confirmation Failed</CardTitle>
              <CardDescription>
                There was a problem confirming your email
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 text-center">
                  {message}
                </p>
                <p className="text-xs text-green-700 text-center mt-2">
                  You&apos;ll be redirected to the application in a few seconds...
                </p>
              </div>
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <Button 
                  onClick={() => router.push('/')}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Continue to Application
                </Button>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 text-center">
                  {message}
                </p>
              </div>
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  This could happen if the link has expired or has already been used.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => router.push('/auth/login')}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Go to Sign In
                  </Button>
                  <Link 
                    href="/auth/signup"
                    className="block text-sm text-orange-600 hover:text-orange-700"
                  >
                    Need to sign up again?
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  )
}
