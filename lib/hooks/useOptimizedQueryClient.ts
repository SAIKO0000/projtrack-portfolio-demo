import { QueryClient } from '@tanstack/react-query'

// Enhanced query client with very aggressive caching
export function createOptimizedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // VERY aggressive caching - data stays fresh much longer
        staleTime: 15 * 60 * 1000, // 15 minutes default
        gcTime: 60 * 60 * 1000, // 1 hour in cache
        
        // Prevent all automatic refetching
        refetchOnWindowFocus: false,
        refetchOnReconnect: false, // Changed from 'always' to false
        refetchOnMount: false,
        refetchInterval: false,
        
        // Smart retry logic
        retry: (failureCount, error: unknown) => {
          const err = error as { status?: number; message?: string }
          
          // Don't retry auth errors
          if (err?.status === 401 || err?.status === 403) return false
          
          // Don't retry if it's a network error and we're offline
          if (err?.message?.includes('Failed to fetch') && !navigator.onLine) return false
          
          // Only retry once for other errors
          return failureCount < 1
        },
        retryDelay: 2000, // Fixed 2 second delay instead of exponential backoff
        
        // Request deduplication
        networkMode: 'online',
      },
      mutations: {
        retry: 0, // Don't retry mutations - they should be idempotent
        networkMode: 'online',
        
        // Don't automatically invalidate anything
        onSettled: () => {
          // Manual invalidation only through smart invalidation system
        }
      }
    },
  })
}

// Query-specific optimizations with different stale times based on data volatility
export const queryOptimizations = {
  // Static/rarely changing data - very long cache
  personnel: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  // Projects change moderately
  projects: {
    staleTime: 10 * 60 * 1000, // 10 minutes  
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  // Tasks change more frequently but not constantly
  tasks: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  // Events are time-sensitive but don't change often
  events: {
    staleTime: 8 * 60 * 1000, // 8 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  // Reports/photos are static after upload
  reports: {
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  photos: {
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours  
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  // Dashboard stats need fresher data but not real-time
  dashboardStats: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  // Individual project data (with relations) - cache aggressively
  singleProject: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  }
}
