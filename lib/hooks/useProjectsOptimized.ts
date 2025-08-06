import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { supabase, queryKeys, getInvalidateQueries } from '@/lib/supabase-query'
import type { Database } from '@/lib/supabase.types'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

// Enhanced Projects Query Hook with Realtime Subscriptions
export function useProjectsQuery() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          tasks:tasks(count),
          reports:reports(count),
          photos:photos(count)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching projects:', error)
        throw error
      }
      return data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - projects don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  })

  // Set up realtime subscription for projects
  useEffect(() => {
    const channel = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Projects realtime update:', payload)
          
          // Invalidate and refetch projects data
          queryClient.invalidateQueries({ queryKey: queryKeys.projects() })
          
          // Also invalidate dashboard stats since they depend on projects
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

// Single Project Query Hook
export function useProjectQuery(projectId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          tasks(
            id, title, status, priority, assigned_to, due_date, 
            progress, created_at, updated_at,
            personnel(name, email)
          ),
          reports(
            id, title, file_url, file_type, file_size, 
            uploaded_at, uploaded_by, description
          ),
          photos(
            id, description, file_url, file_size, 
            taken_at, uploaded_at, uploaded_by
          )
        `)
        .eq('id', projectId)
        .single()
      
      if (error) {
        console.error('Error fetching project:', error)
        throw error
      }
      return data
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  })

  // Realtime subscription for single project
  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`project_${projectId}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) })
          queryClient.invalidateQueries({ queryKey: queryKeys.tasksByProject(projectId) })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) })
          queryClient.invalidateQueries({ queryKey: queryKeys.reportsByProject(projectId) })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) })
          queryClient.invalidateQueries({ queryKey: queryKeys.photosByProject(projectId) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, queryClient])

  return query
}

// Create Project Mutation
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newProject: ProjectInsert) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating project:', error)
        throw error
      }
      return data
    },
    onSuccess: (data) => {
      // Update projects list cache
      queryClient.setQueryData(queryKeys.projects(), (old: Project[] = []) => {
        return [data, ...old]
      })
      
      // Invalidate related queries
      const invalidateQueries = getInvalidateQueries(queryClient)
      invalidateQueries.projects()
      invalidateQueries.dashboard()
    },
    onError: (error) => {
      console.error('Create project error:', error)
    }
  })
}

// Update Project Mutation
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProjectUpdate }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating project:', error)
        throw error
      }
      return data
    },
    onSuccess: (data) => {
      // Update specific project cache
      queryClient.setQueryData(queryKeys.project(data.id), data)
      
      // Update projects list cache
      queryClient.setQueryData(queryKeys.projects(), (old: Project[] = []) => {
        return old.map(project => project.id === data.id ? data : project)
      })
      
      // Invalidate related queries
      const invalidateQueries = getInvalidateQueries(queryClient)
      invalidateQueries.projectData(data.id)
      invalidateQueries.dashboard()
    }
  })
}

// Delete Project Mutation
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
      
      if (error) {
        console.error('Error deleting project:', error)
        throw error
      }
      return projectId
    },
    onSuccess: (deletedId) => {
      // Remove from projects list cache
      queryClient.setQueryData(queryKeys.projects(), (old: Project[] = []) => {
        return old.filter(project => project.id !== deletedId)
      })
      
      // Remove specific project cache
      queryClient.removeQueries({ queryKey: queryKeys.project(deletedId) })
      
      // Invalidate related queries
      const invalidateQueries = getInvalidateQueries(queryClient)
      invalidateQueries.projects()
      invalidateQueries.dashboard()
    }
  })
}

// Prefetch project data for better UX
export function usePrefetchProject() {
  const queryClient = useQueryClient()

  return useCallback((projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.project(projectId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            tasks(id, title, status, progress),
            reports(id, title, uploaded_at),
            photos(id, description, taken_at)
          `)
          .eq('id', projectId)
          .single()
        
        if (error) throw error
        return data
      },
      staleTime: 2 * 60 * 1000, // 2 minutes for prefetch
    })
  }, [queryClient])
}

// Hook for checking if we have cached project data
export function useProjectCache(projectId: string) {
  const queryClient = useQueryClient()
  
  const getCachedProject = useCallback(() => {
    return queryClient.getQueryData(queryKeys.project(projectId))
  }, [queryClient, projectId])
  
  const isCached = useCallback(() => {
    const cached = queryClient.getQueryData(queryKeys.project(projectId))
    return !!cached
  }, [queryClient, projectId])
  
  return {
    getCachedProject,
    isCached
  }
}
