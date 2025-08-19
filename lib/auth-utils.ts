/**
 * Authentication utility functions for handling session issues
 */

export const clearAuthStorage = () => {
  if (typeof window === 'undefined') return
  
  try {
    // Clear localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('supabase.auth.token')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Clear sessionStorage
    const sessionKeysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('supabase.auth.token')) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
    
    // Also clear any other supabase related items
    try {
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.token')
    } catch {
      // Ignore errors
    }
    
    console.log('Auth storage cleared')
  } catch (error) {
    console.error('Error clearing auth storage:', error)
  }
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
  } catch {
    return true
  }
}

export const handleAuthError = (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Handle specific auth errors
  if (errorMessage.includes('refresh_token') || 
      errorMessage.includes('Invalid refresh token') ||
      errorMessage.includes('Refresh Token Not Found') ||
      errorMessage.includes('JWT expired') ||
      errorMessage.includes('refresh token not found')) {
    console.log('Token refresh failed, clearing storage')
    clearAuthStorage()
    return 'Session expired. Please sign in again.'
  }
  
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials.'
  }
  
  if (errorMessage.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link.'
  }
  
  return errorMessage
}

// Helper function to safely handle auth-related API calls
export const withAuthErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await operation()
  } catch (error) {
    // Handle the error more gracefully
    let errorMessage = 'An unknown error occurred'
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      // Handle case where error is an object (like "[object Object]")
      errorMessage = JSON.stringify(error, null, 2)
      console.error('Detailed error object:', error)
    } else {
      errorMessage = String(error)
    }
    
    const friendlyError = handleAuthError(errorMessage)
    console.error('Auth operation failed:', friendlyError)
    
    // If it's a session-related error, clear storage and optionally redirect
    if (friendlyError.includes('Session expired')) {
      clearAuthStorage()
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
    
    // Don't throw error for status updates, just log and continue
    if (errorMessage.includes('status') || errorMessage.includes('update')) {
      console.warn('Non-critical operation failed:', friendlyError)
      return fallback
    }
    
    return fallback
  }
}
