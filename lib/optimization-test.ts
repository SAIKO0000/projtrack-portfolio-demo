// Integration test for optimization rollout
// Run this to verify optimizations work without breaking functionality

import { runtimeConfig, getCurrentConfig } from './optimization-flags'
import { queryKeys as optimizedQueryKeys } from './query-keys-optimized'
import { queryKeys as legacyQueryKeys } from './supabase-query'
import { getOptimizedSelect } from './queries/optimized-selects'

export function testOptimizationIntegration() {
  console.log('🧪 Testing optimization integration...')
  
  // Test 1: Feature flags
  try {
    const config = getCurrentConfig()
    console.log('✅ Feature flags loaded:', config)
  } catch (error) {
    console.error('❌ Feature flags failed:', error)
    return false
  }
  
  // Test 2: Query keys compatibility
  try {
    const optimizedProjectsKey = optimizedQueryKeys.projects()
    const legacyProjectsKey = legacyQueryKeys.projects()
    console.log('✅ Query keys working:', { optimized: optimizedProjectsKey, legacy: legacyProjectsKey })
  } catch (error) {
    console.error('❌ Query keys failed:', error)
    return false
  }
  
  // Test 3: Optimized selects
  try {
    const projectsSelect = getOptimizedSelect('projects')
    const tasksSelect = getOptimizedSelect('tasks')
    console.log('✅ Optimized selects working:', { projects: projectsSelect, tasks: tasksSelect })
  } catch (error) {
    console.error('❌ Optimized selects failed:', error)
    return false
  }
  
  // Test 4: Runtime configuration
  try {
    const shouldUseOptimized = runtimeConfig.shouldUseOptimizedClient()
    const shouldUseOptimizedSupabase = runtimeConfig.shouldUseOptimizedSupabase()
    const shouldUseOptimizedSelects = runtimeConfig.shouldUseOptimizedSelects()
    
    console.log('✅ Runtime config working:', {
      optimizedClient: shouldUseOptimized,
      optimizedSupabase: shouldUseOptimizedSupabase,
      optimizedSelects: shouldUseOptimizedSelects
    })
  } catch (error) {
    console.error('❌ Runtime config failed:', error)
    return false
  }
  
  console.log('🎉 All optimization integration tests passed!')
  return true
}

// Performance monitoring helper
export function logOptimizationMetrics() {
  const config = getCurrentConfig()
  
  console.group('📊 Optimization Status')
  console.log('Optimization Level:', config.runtime.optimizationLevel)
  console.log('Target DB Reduction:', `${config.targets.dbReduction}%`)
  console.log('Target Auth Reduction:', `${config.targets.authReduction}%`)
  console.log('Optimized Client:', config.runtime.optimizedClient ? '✅' : '❌')
  console.log('Optimized Supabase:', config.runtime.optimizedSupabase ? '✅' : '❌')
  console.log('Optimized Selects:', config.runtime.optimizedSelects ? '✅' : '❌')
  console.log('Batch Queries:', config.runtime.batchQueries ? '✅' : '❌')
  console.groupEnd()
}

// Emergency fallback helper
export function enableEmergencyFallback() {
  console.warn('🚨 EMERGENCY FALLBACK ACTIVATED - All optimizations disabled')
  
  // In a real scenario, this would set environment variables or localStorage
  // For now, we'll just log the instructions
  console.log('To disable optimizations, set: EMERGENCY_FALLBACK=true')
  console.log('Or in development, add to .env.local:')
  console.log('EMERGENCY_FALLBACK=true')
  
  return {
    message: 'Emergency fallback instructions logged to console',
    envVar: 'EMERGENCY_FALLBACK=true'
  }
}

// Development helper to show current environment variables
export function showOptimizationEnvVars() {
  console.group('🔧 Optimization Environment Variables')
  console.log('OPT_USE_OPTIMIZED_CLIENT:', process.env.OPT_USE_OPTIMIZED_CLIENT || 'undefined (defaults to true)')
  console.log('OPT_USE_OPTIMIZED_SUPABASE:', process.env.OPT_USE_OPTIMIZED_SUPABASE || 'undefined (defaults to true)')
  console.log('OPT_USE_OPTIMIZED_SELECTS:', process.env.OPT_USE_OPTIMIZED_SELECTS || 'undefined (defaults to true)')
  console.log('OPT_USE_UNIFIED_KEYS:', process.env.OPT_USE_UNIFIED_KEYS || 'undefined (defaults to true)')
  console.log('OPTIMIZATION_LEVEL:', process.env.OPTIMIZATION_LEVEL || 'undefined (defaults to 2)')
  console.log('EMERGENCY_FALLBACK:', process.env.EMERGENCY_FALLBACK || 'undefined (defaults to false)')
  console.groupEnd()
}
