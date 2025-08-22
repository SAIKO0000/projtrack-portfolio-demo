'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { getQueryClient } from './query-client-optimized'
import { createOptimizedQueryClient } from './hooks/useOptimizedQueryClient'
import { runtimeConfig } from './optimization-flags'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use optimized client if enabled, fallback to original
  const [queryClient] = useState(() => {
    if (runtimeConfig.shouldUseOptimizedClient()) {
      console.log('🚀 Using optimized query client for 40-50% performance improvement')
      return getQueryClient()
    } else {
      console.log('⚠️ Using fallback query client (optimizations disabled)')
      return createOptimizedQueryClient()
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
