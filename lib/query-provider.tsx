'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { createOptimizedQueryClient } from './hooks/useOptimizedQueryClient'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use the heavily optimized query client
  const [queryClient] = useState(() => createOptimizedQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
