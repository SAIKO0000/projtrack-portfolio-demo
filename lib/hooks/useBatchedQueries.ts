import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { queryKeys } from '../supabase-query'

// Hook for batching multiple data requests and preventing duplicate fetches
export function useBatchedQueries() {
  const queryClient = useQueryClient()
  const pendingBatchRef = useRef<Set<string>>(new Set())
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Batch multiple invalidations into a single operation
  const batchInvalidate = useCallback((keys: string[]) => {
    keys.forEach(key => pendingBatchRef.current.add(key))
    
    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }
    
    // Batch invalidations - wait 100ms to collect more
    batchTimeoutRef.current = setTimeout(() => {
      const uniqueKeys = Array.from(pendingBatchRef.current)
      
      // Group related invalidations
      const hasProjects = uniqueKeys.some(k => k.includes('projects'))
      const hasTasks = uniqueKeys.some(k => k.includes('tasks'))
      const hasDashboard = uniqueKeys.some(k => k.includes('dashboard'))
      
      // Only invalidate what's actually needed
      if (hasDashboard && (hasProjects || hasTasks)) {
        // If both data and dashboard need updating, only invalidate dashboard stats
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dashboardStats(), 
          exact: true 
        })
      } else {
        // Otherwise invalidate individually
        uniqueKeys.forEach(key => {
          if (key === 'projects') {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects(), exact: true })
          } else if (key === 'tasks') {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks(), exact: true })
          } else if (key === 'dashboard') {
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats(), exact: true })
          }
        })
      }
      
      // Clear the batch
      pendingBatchRef.current.clear()
      batchTimeoutRef.current = null
    }, 100)
  }, [queryClient])

  // Prefetch data that's likely to be needed soon
  const smartPrefetch = useCallback(async (context: 'dashboard' | 'project-detail' | 'gantt') => {
    const promises: Promise<unknown>[] = []
    
    switch (context) {
      case 'dashboard':
        // Prefetch core dashboard data if not already cached
        if (!queryClient.getQueryData(queryKeys.projects())) {
          promises.push(queryClient.prefetchQuery({
            queryKey: queryKeys.projects(),
            staleTime: 10 * 60 * 1000
          }))
        }
        if (!queryClient.getQueryData(queryKeys.personnel())) {
          promises.push(queryClient.prefetchQuery({
            queryKey: queryKeys.personnel(),
            staleTime: 30 * 60 * 1000
          }))
        }
        break
        
      case 'project-detail':
        // Prefetch tasks and events when viewing project details
        promises.push(
          queryClient.prefetchQuery({
            queryKey: queryKeys.tasks(),
            staleTime: 5 * 60 * 1000
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.events(),
            staleTime: 8 * 60 * 1000
          })
        )
        break
        
      case 'gantt':
        // Prefetch all task-related data for Gantt charts
        if (!queryClient.getQueryData(queryKeys.tasks())) {
          promises.push(queryClient.prefetchQuery({
            queryKey: queryKeys.tasks(),
            staleTime: 5 * 60 * 1000
          }))
        }
        if (!queryClient.getQueryData(queryKeys.personnel())) {
          promises.push(queryClient.prefetchQuery({
            queryKey: queryKeys.personnel(),
            staleTime: 30 * 60 * 1000
          }))
        }
        break
    }
    
    // Execute all prefetches in parallel
    if (promises.length > 0) {
      try {
        await Promise.allSettled(promises)
      } catch (error) {
        console.warn('Some prefetches failed:', error)
      }
    }
  }, [queryClient])

  // Check if data exists in cache before making a request
  const getCachedData = useCallback(<T>(queryKey: unknown[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey)
  }, [queryClient])

  // Smart cache warming - preload data before user navigation
  const warmCache = useCallback((projectId?: string) => {
    // Warm up project-specific caches if we know the user might need them
    if (projectId) {
      const projectData = queryClient.getQueryData(queryKeys.project(projectId))
      if (!projectData) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.project(projectId),
          staleTime: 15 * 60 * 1000
        })
      }
      
      // Also warm up related data
      const taskData = queryClient.getQueryData(queryKeys.tasksByProject(projectId))
      if (!taskData) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.tasksByProject(projectId),
          staleTime: 5 * 60 * 1000
        })
      }
    }
  }, [queryClient])

  // Cleanup stale queries to free memory
  const cleanupStaleQueries = useCallback(() => {
    // Remove queries that haven't been used for a while
    queryClient.getQueryCache().clear()
  }, [queryClient])

  return {
    batchInvalidate,
    smartPrefetch,
    getCachedData,
    warmCache,
    cleanupStaleQueries
  }
}
