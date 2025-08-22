import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, queryKeys as legacyQueryKeys } from '@/lib/supabase-query'
import { supabase as optimizedSupabase } from '@/lib/supabase-optimized'
import { queryKeys as optimizedQueryKeys } from '@/lib/query-keys-optimized'
import { getOptimizedSelect } from '@/lib/queries/optimized-selects'
import { runtimeConfig } from '@/lib/optimization-flags'
import { toast } from 'react-hot-toast'
import { queryOptimizations } from './useOptimizedQueryClient'
import { useBatchedQueries } from './useBatchedQueries'

// Centralized hook for all Supabase queries with intelligent caching
export function useSupabaseQuery() {
  const queryClient = useQueryClient()
  const { getCachedData, smartPrefetch } = useBatchedQueries()
  
  // Smart client selection based on feature flags
  const activeSupabase = runtimeConfig.shouldUseOptimizedSupabase() ? optimizedSupabase : supabase
  const activeQueryKeys = runtimeConfig.isOptimizationEnabled('USE_UNIFIED_QUERY_KEYS') ? optimizedQueryKeys : legacyQueryKeys

  // Projects with optimized caching
  const useProjectsQuery = () => {
    // Check cache first - avoid query if fresh data exists
    const cachedData = getCachedData([...activeQueryKeys.projects()])
    
    return useQuery({
      queryKey: activeQueryKeys.projects(),
      queryFn: async () => {
        const selectColumns = runtimeConfig.shouldUseOptimizedSelects() 
          ? getOptimizedSelect('projects')
          : '*'
          
        runtimeConfig.logMetric('Projects Query', 1, 'DB call')
        
        const { data, error } = await activeSupabase
          .from('projects')
          .select(selectColumns)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return data || []
      },
      ...queryOptimizations.projects,
      
      // Only fetch if we don't have recent data
      enabled: !cachedData || (queryClient.getQueryState(activeQueryKeys.projects())?.dataUpdatedAt ?? 0) < Date.now() - queryOptimizations.projects.staleTime,
    })
  }

  // Personnel with extended cache time
  const usePersonnelQuery = () => {
    const cachedData = getCachedData([...activeQueryKeys.personnel()])
    
    return useQuery({
      queryKey: activeQueryKeys.personnel(),
      queryFn: async () => {
        const selectColumns = runtimeConfig.shouldUseOptimizedSelects() 
          ? getOptimizedSelect('personnel')
          : '*'
          
        runtimeConfig.logMetric('Personnel Query', 1, 'DB call')
        
        const { data, error } = await activeSupabase
          .from('personnel')
          .select(selectColumns)
          .order('name', { ascending: true })
        
        if (error) throw error
        return data || []
      },
      ...queryOptimizations.personnel,
      enabled: !cachedData || (queryClient.getQueryState(activeQueryKeys.personnel())?.dataUpdatedAt ?? 0) < Date.now() - queryOptimizations.personnel.staleTime,
    })
  }

  // Tasks with moderate caching
  const useTasksQuery = () => {
    const cachedData = getCachedData([...activeQueryKeys.tasks()])
    
    return useQuery({
      queryKey: activeQueryKeys.tasks(),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id, name, status, priority, due_date, created_at, updated_at, 
            project_id, assigned_to, description, progress,
            project:projects(id, name),
            assignee:personnel(id, name)
          `)
          .order('updated_at', { ascending: false })
        
        if (error) throw error
        return data || []
      },
      ...queryOptimizations.tasks,
      enabled: !cachedData || (queryClient.getQueryState(activeQueryKeys.tasks())?.dataUpdatedAt ?? 0) < Date.now() - queryOptimizations.tasks.staleTime,
    })
  }

  // Events with date-based caching
  const useEventsQuery = () => {
    const cachedData = getCachedData([...activeQueryKeys.events()])
    
    return useQuery({
      queryKey: activeQueryKeys.events(),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id, title, date, time, type, created_at, project_id, description,
            project:projects(id, name)
          `)
          .order('date', { ascending: true })
        
        if (error) throw error
        return data || []
      },
      ...queryOptimizations.events,
      enabled: !cachedData || (queryClient.getQueryState(activeQueryKeys.events())?.dataUpdatedAt ?? 0) < Date.now() - queryOptimizations.events.staleTime,
    })
  }

  // Reports with file-based caching
  const useReportsQuery = () => {
    const cachedData = getCachedData([...activeQueryKeys.reports()])
    
    return useQuery({
      queryKey: activeQueryKeys.reports(),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            id, file_name, file_path, uploaded_at, uploaded_by, 
            description, project_id, file_size, mime_type,
            project:projects(id, name),
            uploader:personnel(id, name)
          `)
          .order('uploaded_at', { ascending: false })
        
        if (error) throw error
        return data || []
      },
      ...queryOptimizations.reports,
      enabled: !cachedData || (queryClient.getQueryState(activeQueryKeys.reports())?.dataUpdatedAt ?? 0) < Date.now() - queryOptimizations.reports.staleTime,
    })
  }

  // Photos with aggressive caching since they're static
  const usePhotosQuery = () => {
    const cachedData = getCachedData([...activeQueryKeys.photos()])
    
    return useQuery({
      queryKey: activeQueryKeys.photos(),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('photos')
          .select(`
            id, description, storage_path, upload_date, created_at, 
            uploaded_by, project_id,
            project:projects(id, name),
            uploader:personnel(id, name)
          `)
          .order('upload_date', { ascending: false })
        
        if (error) throw error
        return data || []
      },
      ...queryOptimizations.photos,
      enabled: !cachedData || (queryClient.getQueryState(activeQueryKeys.photos())?.dataUpdatedAt ?? 0) < Date.now() - queryOptimizations.photos.staleTime,
    })
  }

  return {
    // Query hooks
    useProjectsQuery,
    usePersonnelQuery,
    useTasksQuery,
    useEventsQuery,
    useReportsQuery,
    usePhotosQuery,
    
    // Cache utilities
    invalidateAll: () => {
      queryClient.invalidateQueries()
      toast.success('Cache refreshed')
    },
    
    // Enhanced prefetch with smart context awareness
    prefetchForDashboard: () => smartPrefetch('dashboard'),
    prefetchForProjectDetail: () => smartPrefetch('project-detail'),
    prefetchForGantt: () => smartPrefetch('gantt'),
  }
}
