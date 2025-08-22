// Optimized QueryClient configuration with aggressive caching and smart defaults
import { QueryClient, DefaultOptions } from '@tanstack/react-query'

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

// Configuration from environment variables with fallbacks
export const optimizationConfig = {
  queryStaleTime: Number(process.env.OPT_QUERY_STALE_TIME_MS) || 300000, // 5 minutes
  queryGcTime: Number(process.env.OPT_QUERY_GC_TIME_MS) || 1800000, // 30 minutes
  disableWindowFocusRefetch: process.env.OPT_DISABLE_WINDOW_FOCUS_REFETCH === 'true',
  reduceAuthCalls: process.env.OPT_REDUCE_AUTH_CALLS === 'true',
  realtimeScoped: process.env.OPT_REALTIME_SCOPED === 'true',
  useBundledEdgeReads: process.env.OPT_USE_BUNDLED_EDGE_READS === 'true',
  disableCountExact: process.env.OPT_DISABLE_COUNT_EXACT === 'true',
  optimizationLevel: Number(process.env.OPTIMIZATION_LEVEL) || 1
}

// Query-specific optimizations based on data volatility
export const queryOptimizations = {
  // Static/rarely changing data - very long cache
  personnel: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  },
  
  // Projects change moderately
  projects: {
    staleTime: 10 * 60 * 1000, // 10 minutes  
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always'
  },
  
  // Tasks change more frequently but not constantly
  tasks: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always'
  },
  
  // Events are mostly static once created
  events: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  },
  
  // Reports don't change often after upload
  reports: {
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours  
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  },
  
  // Photos are static once uploaded
  photos: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  },
  
  // Dashboard stats need fresher data but not real-time
  dashboardStats: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always'
  },
  
  // User session and profile - moderate caching
  auth: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always'
  },
  
  // Search results - short cache since they're context dependent
  search: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  }
} as const

// Default options for QueryClient
const getDefaultOptions = (): DefaultOptions => ({
  queries: {
    // Conservative defaults - individual queries override as needed
    staleTime: optimizationConfig.queryStaleTime,
    gcTime: optimizationConfig.queryGcTime,
    
    // Prevent automatic refetching to reduce API calls
    refetchOnWindowFocus: !optimizationConfig.disableWindowFocusRefetch,
    refetchOnReconnect: 'always',
    refetchOnMount: false,
    refetchInterval: false,
    
    // Smart retry logic
    retry: (failureCount, error: unknown) => {
      const err = error as { status?: number; message?: string }
      
      // Don't retry auth errors
      if (err?.status === 401 || err?.status === 403) return false
      
      // Don't retry if offline
      if (err?.message?.includes('Failed to fetch') && !navigator.onLine) return false
      
      // Only retry twice for other errors
      return failureCount < 2
    },
    
    // Fixed retry delay instead of exponential backoff
    retryDelay: 2000,
    
    // Request deduplication
    networkMode: 'online'
  },
  mutations: {
    // Don't retry mutations - they should be idempotent
    retry: 0,
    networkMode: 'online'
  }
})

// Enhanced QueryClient factory
export function createOptimizedQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: getDefaultOptions()
  })
  
  // Development-only enhancements
  if (isDevelopment) {
    // Track query performance
    const originalFetch = queryClient.getQueryCache().getAll
    let queryCount = 0
    
    queryClient.getQueryCache().getAll = function() {
      queryCount++
      if (queryCount % 10 === 0) {
        console.log(`🔍 Total queries in cache: ${queryCount}`)
      }
      return originalFetch.call(this)
    }
    
    // Log slow queries
    queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.state.fetchStatus === 'idle') {
        const duration = Date.now() - (event.query.state.dataUpdatedAt || 0)
        if (duration > 1000) {
          console.warn(`🐌 Slow query detected:`, event.query.queryKey, `${duration}ms`)
        }
      }
    })
  }
  
  // Cleanup stale queries periodically in production
  if (isProduction) {
    setInterval(() => {
      queryClient.getQueryCache().clear()
    }, 30 * 60 * 1000) // Every 30 minutes
  }
  
  return queryClient
}

// Query client singleton with environment isolation
let _queryClient: QueryClient | null = null

export function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = createOptimizedQueryClient()
  }
  return _queryClient
}

// Reset query client (for testing)
export function resetQueryClient(): void {
  _queryClient = null
}

// Performance monitoring utilities
export const queryMetrics = {
  requestCount: 0,
  cacheHitRate: 0,
  averageQueryTime: 0,
  
  incrementRequest() {
    this.requestCount++
  },
  
  trackCacheHit(isHit: boolean) {
    // Simple cache hit rate calculation
    this.cacheHitRate = isHit ? this.cacheHitRate + 0.1 : this.cacheHitRate - 0.1
    this.cacheHitRate = Math.max(0, Math.min(1, this.cacheHitRate))
  },
  
  trackQueryTime(duration: number) {
    this.averageQueryTime = (this.averageQueryTime + duration) / 2
  },
  
  getStats() {
    return {
      requestCount: this.requestCount,
      cacheHitRate: Math.round(this.cacheHitRate * 100),
      averageQueryTime: Math.round(this.averageQueryTime)
    }
  },
  
  reset() {
    this.requestCount = 0
    this.cacheHitRate = 0
    this.averageQueryTime = 0
  }
}

// Emergency fallback configuration
export const EMERGENCY_FALLBACK = process.env.EMERGENCY_FALLBACK === 'true'

if (EMERGENCY_FALLBACK) {
  console.warn('🚨 Emergency fallback mode activated - using minimal optimizations')
}
