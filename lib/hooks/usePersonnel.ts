"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { clearAuthStorage, handleAuthError } from '@/lib/auth-utils'
import type { Database } from '@/lib/supabase.types'

type Personnel = Database['public']['Tables']['personnel']['Row']

export function usePersonnel() {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPersonnel = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        const friendlyError = handleAuthError(sessionError)
        if (friendlyError.includes('Session expired')) {
          clearAuthStorage()
          setError('Authentication required. Please sign in.')
          setPersonnel([])
          return
        }
        throw sessionError
      }

      // If no session, we might be in a public context - try to fetch anyway
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .order('name')
      
      if (error) {
        // Handle auth-related errors specifically
        if (error.message.includes('JWT') || 
            error.message.includes('refresh') ||
            error.message.includes('token')) {
          clearAuthStorage()
          setError('Authentication required. Please sign in.')
          setPersonnel([])
          return
        }
        throw error
      }
      
      setPersonnel(data || [])
    } catch (err) {
      console.error('Error fetching personnel:', err)
      const friendlyError = handleAuthError(err)
      setError(friendlyError)
      
      // If it's an auth error, clear personnel data
      if (friendlyError.includes('Session expired') || friendlyError.includes('Authentication required')) {
        setPersonnel([])
      }
    } finally {
      setLoading(false)
    }
  }

  const getPersonnelById = async (id: string): Promise<Personnel | null> => {
    try {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.message.includes('JWT') || 
            error.message.includes('refresh') ||
            error.message.includes('token')) {
          clearAuthStorage()
          return null
        }
        throw error
      }
      return data
    } catch (err) {
      console.error('Error fetching personnel by ID:', err)
      handleAuthError(err)
      return null
    }
  }

  useEffect(() => {
    fetchPersonnel()
  }, [])

  return {
    personnel,
    loading,
    error,
    fetchPersonnel,
    getPersonnelById
  }
}
