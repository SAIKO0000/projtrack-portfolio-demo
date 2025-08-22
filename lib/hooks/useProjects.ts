import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Project } from '@/lib/supabase'
import { queryKeys } from '@/lib/supabase-query'
import { withAuthErrorHandling } from '@/lib/auth-utils'
import { toast } from 'react-hot-toast'

export function useProjects() {
  const queryClient = useQueryClient()

  // Main projects query with aggressive caching
  const query = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: async () => {
      return withAuthErrorHandling(async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
      }, [])
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return withAuthErrorHandling(async () => {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)

        if (error) throw error
        return projectId
      }, undefined)
    },
    onSuccess: (deletedId) => {
      // Update cache by removing the deleted project
      queryClient.setQueryData(queryKeys.projects(), (old: Project[] | undefined) =>
        old ? old.filter(p => p.id !== deletedId) : []
      )
      toast.success('Project deleted successfully')
    },
    onError: (error) => {
      console.error('Delete project error:', error)
      toast.error('Failed to delete project')
    }
  })

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      return withAuthErrorHandling(async () => {
        const { data, error } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      }, undefined)
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.projects() })

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(queryKeys.projects())

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.projects(), (old: Project[] | undefined) => {
        if (!old) return []
        return old.map(p => p.id === id ? { ...p, ...updates } : p)
      })

      // Return a context object with the snapshotted value
      return { previousProjects }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects(), context.previousProjects)
      }
      console.error('Update project error:', err)
      toast.error('Failed to update project')
    },
    onSuccess: (updatedProject) => {
      // Update cache with the server response
      queryClient.setQueryData(queryKeys.projects(), (old: Project[] | undefined) =>
        old ? old.map(p => p.id === updatedProject?.id ? updatedProject : p) : [updatedProject]
      )
      toast.success('Project updated successfully!')
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() })
    }
  })

  // Wrapper function to match the expected interface
  const updateProject = (id: string, updates: Partial<Project>) => {
    updateProjectMutation.mutate({ id, updates })
  }

  return {
    projects: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    fetchProjects: query.refetch,
    deleteProject: deleteProjectMutation.mutate,
    updateProject: updateProject,
    isDeleting: deleteProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending
  }
}