// Feature flags for safe optimization rollout
// Environment variables control the optimization level

export const optimizationFlags = {
  // Core optimization toggles
  USE_OPTIMIZED_QUERY_CLIENT: process.env.OPT_USE_OPTIMIZED_CLIENT !== 'false',
  USE_OPTIMIZED_SUPABASE_CLIENT: process.env.OPT_USE_OPTIMIZED_SUPABASE !== 'false',
  USE_OPTIMIZED_SELECTS: process.env.OPT_USE_OPTIMIZED_SELECTS !== 'false',
  USE_UNIFIED_QUERY_KEYS: process.env.OPT_USE_UNIFIED_KEYS !== 'false',
  
  // Performance features
  ENABLE_AGGRESSIVE_CACHING: process.env.OPT_AGGRESSIVE_CACHING === 'true',
  REDUCE_AUTH_CALLS: process.env.OPT_REDUCE_AUTH_CALLS === 'true',
  BATCH_QUERIES: process.env.OPT_BATCH_QUERIES === 'true',
  
  // Realtime optimizations
  SCOPE_REALTIME_SUBSCRIPTIONS: process.env.OPT_SCOPE_REALTIME === 'true',
  REDUCE_REALTIME_FREQUENCY: process.env.OPT_REDUCE_REALTIME_FREQ === 'true',
  
  // Development features
  ENABLE_PERFORMANCE_MONITORING: process.env.OPT_MONITOR_PERFORMANCE === 'true',
  LOG_QUERY_METRICS: process.env.OPT_LOG_METRICS === 'true',
  EMERGENCY_FALLBACK: process.env.EMERGENCY_FALLBACK === 'true',
  
  // Target reduction levels
  DB_REDUCTION_TARGET: Number(process.env.OPT_DB_REDUCTION_TARGET) || 40, // 40% default
  AUTH_REDUCTION_TARGET: Number(process.env.OPT_AUTH_REDUCTION_TARGET) || 50, // 50% default
  
  // Optimization level (0-3, where 3 is most aggressive)
  OPTIMIZATION_LEVEL: Number(process.env.OPTIMIZATION_LEVEL) || 2
} as const

// Runtime optimization configuration
export const runtimeConfig = {
  isOptimizationEnabled: (flag: keyof typeof optimizationFlags): boolean => {
    // Emergency fallback - disable all optimizations
    if (optimizationFlags.EMERGENCY_FALLBACK) {
      console.warn('🚨 Emergency fallback mode - optimizations disabled')
      return false
    }
    
    return optimizationFlags[flag] as boolean
  },
  
  getOptimizationLevel: (): number => {
    if (optimizationFlags.EMERGENCY_FALLBACK) return 0
    return optimizationFlags.OPTIMIZATION_LEVEL
  },
  
  shouldUseOptimizedClient: (): boolean => {
    return runtimeConfig.isOptimizationEnabled('USE_OPTIMIZED_QUERY_CLIENT')
  },
  
  shouldUseOptimizedSupabase: (): boolean => {
    return runtimeConfig.isOptimizationEnabled('USE_OPTIMIZED_SUPABASE_CLIENT')
  },
  
  shouldUseOptimizedSelects: (): boolean => {
    return runtimeConfig.isOptimizationEnabled('USE_OPTIMIZED_SELECTS')
  },
  
  shouldBatchQueries: (): boolean => {
    return runtimeConfig.isOptimizationEnabled('BATCH_QUERIES')
  },
  
  // Performance monitoring helpers
  logMetric: (metric: string, value: number, context?: string) => {
    if (optimizationFlags.LOG_QUERY_METRICS) {
      console.log(`📊 ${metric}: ${value}${context ? ` (${context})` : ''}`)
    }
  },
  
  measurePerformance: <T>(fn: () => T, label: string): T => {
    if (!optimizationFlags.ENABLE_PERFORMANCE_MONITORING) {
      return fn()
    }
    
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    runtimeConfig.logMetric(`${label} Duration`, Math.round(duration), 'ms')
    
    return result
  }
}

// Environment variable defaults for development
export const defaultEnvVars = {
  OPT_USE_OPTIMIZED_CLIENT: 'true',
  OPT_USE_OPTIMIZED_SUPABASE: 'true', 
  OPT_USE_OPTIMIZED_SELECTS: 'true',
  OPT_USE_UNIFIED_KEYS: 'true',
  OPT_AGGRESSIVE_CACHING: 'false', // Conservative by default
  OPT_REDUCE_AUTH_CALLS: 'true',
  OPT_BATCH_QUERIES: 'true',
  OPT_SCOPE_REALTIME: 'false', // Conservative by default
  OPT_REDUCE_REALTIME_FREQ: 'true',
  OPT_MONITOR_PERFORMANCE: 'true',
  OPT_LOG_METRICS: 'false', // Can be noisy
  OPTIMIZATION_LEVEL: '2',
  OPT_DB_REDUCTION_TARGET: '40',
  OPT_AUTH_REDUCTION_TARGET: '50'
}

// Export current configuration for debugging
export const getCurrentConfig = () => ({
  flags: optimizationFlags,
  runtime: {
    optimizationLevel: runtimeConfig.getOptimizationLevel(),
    optimizedClient: runtimeConfig.shouldUseOptimizedClient(),
    optimizedSupabase: runtimeConfig.shouldUseOptimizedSupabase(),
    optimizedSelects: runtimeConfig.shouldUseOptimizedSelects(),
    batchQueries: runtimeConfig.shouldBatchQueries()
  },
  targets: {
    dbReduction: optimizationFlags.DB_REDUCTION_TARGET,
    authReduction: optimizationFlags.AUTH_REDUCTION_TARGET
  }
})
