"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { clearAuthStorage, handleAuthError } from './auth-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface AuthContextType {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, userData: UserData) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  loading: boolean
}

interface UserData {
  name: string
  position: string
  department: string
  phone?: string
  prcLicense?: string
  yearsExperience?: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error)
          // Handle token refresh errors
          const friendlyError = handleAuthError(error)
          if (friendlyError.includes('Session expired')) {
            clearAuthStorage()
            setSession(null)
            setUser(null)
            return
          }
          throw error
        }
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
        // Clear any corrupt session data
        clearAuthStorage()
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_OUT') {
        toast.success('Successfully signed out. See you next time!', {
          duration: 3000,
          style: {
            background: 'linear-gradient(to right, #f97316, #ea580c)',
            color: 'white',
          },
        })
        router.push('/auth/login')
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      }
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const friendlyError = handleAuthError(error)
        return { success: false, error: friendlyError }
      }

      toast.success('Welcome back! Successfully signed in.', {
        duration: 3000,
        style: {
          background: 'linear-gradient(to right, #f97316, #ea580c)',
          color: 'white',
        },
      })

      router.push('/')
      return { success: true }
    } catch (error: unknown) {
      const friendlyError = handleAuthError(error)
      return { success: false, error: friendlyError }
    } finally {
      setLoading(false)
    }
  }, [router])

  const signUp = useCallback(async (email: string, password: string, userData: UserData) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            position: userData.position,
            department: userData.department,
            phone: userData.phone,
            prc_license: userData.prcLicense,
            years_experience: userData.yearsExperience,
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Try to create a personnel record (optional - don't fail signup if this fails)
      if (data.user) {
        try {
          const { error: personnelError } = await supabase
            .from('personnel')
            .insert({
              id: data.user.id,
              name: userData.name,
              email: email,
              position: userData.position,
              department: userData.department,
              phone: userData.phone || null,
              prc_license: userData.prcLicense || null,
              years_experience: userData.yearsExperience || null,
            })

          if (personnelError) {
            console.warn('Personnel record creation failed (non-critical):', personnelError)
            // Don't throw - this is optional and shouldn't block signup
          }
        } catch (personnelCreateError) {
          console.warn('Personnel table may not exist or have different schema:', personnelCreateError)
          // Continue with signup even if personnel record creation fails
        }
      }

      toast.success('Account created successfully! Please check your email to verify your account.', {
        duration: 5000,
        style: {
          background: 'linear-gradient(to right, #f97316, #ea580c)',
          color: 'white',
        },
      })

      router.push('/auth/login')
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [router])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('SignOut error:', error)
        // Even if signOut fails, clear local state
      }
      
      // Always clear local state
      setSession(null)
      setUser(null)
      
    } catch (error) {
      console.error('Error signing out:', error)
      // Always clear local state even on error
      setSession(null)
      setUser(null)
      toast.error('Error signing out. Session cleared locally.')
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(() => ({
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
  }), [user, session, signIn, signUp, signOut, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
