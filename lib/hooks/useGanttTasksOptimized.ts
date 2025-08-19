import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/supabase-query'
import { withAuthErrorHandling } from '@/lib/auth-utils'
import { toast } from 'react-hot-toast'

export type GanttTask = {
  id: string
  title: string | null
  description: string | null
  status: string
  priority: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  project_id: string | null
  assigned_to: string | null
  progress: number | null
  phase: string | null
  category: string | null
  estimated_hours: number | null
  dependencies: string[] | null
  notes: string | null
}

export interface GanttTaskWithDependencies extends GanttTask {
  dependencyTasks?: GanttTask[]
}

export function useGanttTasksOptimized(projectId?: string) {
  const queryClient = useQueryClient()

  // Main Gantt tasks query with aggressive caching
  const query = useQuery({
    queryKey: queryKeys.ganttTasks(projectId),
    queryFn: async () => {
      return withAuthErrorHandling(async () => {
        let query = supabase
          .from('tasks')
          .select('*')
          .not('start_date', 'is', null)
          .not('end_date', 'is', null)
          .order('start_date', { ascending: true })

        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        // Optimize dependency fetching with a single query
        const tasksWithDependencies: GanttTaskWithDependencies[] = []
        const allDependencyIds = new Set<string>()

        // Collect all dependency IDs
        ;(data || []).forEach(task => {
          if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach((depId: string) => allDependencyIds.add(depId))
          }
        })

        // Fetch all dependencies in one query if there are any
        let dependencyTasksMap: Record<string, GanttTask> = {}
        if (allDependencyIds.size > 0) {
          const { data: depTasks } = await supabase
            .from('tasks')
            .select('*')
            .in('id', Array.from(allDependencyIds))
          
          dependencyTasksMap = (depTasks || []).reduce((acc, task) => {
            acc[task.id] = task
            return acc
          }, {} as Record<string, GanttTask>)
        }

        // Map tasks with their dependencies
        ;(data || []).forEach(task => {
          if (task.dependencies && task.dependencies.length > 0) {
            const dependencyTasks = task.dependencies
              .map((depId: string) => dependencyTasksMap[depId])
              .filter(Boolean)
            
            tasksWithDependencies.push({
              ...task,
              dependencyTasks
            })
          } else {
            tasksWithDependencies.push(task)
          }
        })

        return tasksWithDependencies
      })
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('auth') || error?.message?.includes('JWT')) {
        return false
      }
      return failureCount < 2
    }
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Omit<GanttTask, 'id' | 'created_at' | 'updated_at'>) => {
      return withAuthErrorHandling(async () => {
        const { data, error } = await supabase
          .from('tasks')
          .insert([taskData])
          .select()
          .single()

        if (error) {
          throw error
        }

        return data
      })
    },
    onSuccess: () => {
      // Invalidate and refetch Gantt tasks
      queryClient.invalidateQueries({ queryKey: queryKeys.ganttTasks() })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
      toast.success('Task created successfully')
    },
    onError: (error) => {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<GanttTask> }) => {
      return withAuthErrorHandling(async () => {
        const { data, error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', taskId)
          .select()
          .single()

        if (error) {
          throw error
        }

        return data
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ganttTasks() })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
      toast.success('Task updated successfully')
    },
    onError: (error) => {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return withAuthErrorHandling(async () => {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)

        if (error) {
          throw error
        }

        return { success: true }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ganttTasks() })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
      toast.success('Task deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  })

  // Update task status mutation with completion tracking
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return withAuthErrorHandling(async () => {
        // Prepare update data
        const updateData: { status: string; completed_at?: string | null } = { status }
        
        // If status is completed, add completion timestamp in Philippines timezone
        if (status === 'completed') {
          const now = new Date()
          const philippinesOffset = 8 * 60 // Philippines is UTC+8
          const localOffset = now.getTimezoneOffset()
          const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
          updateData.completed_at = philippinesTime.toISOString()
        } else {
          // If status is not completed, clear completion timestamp
          updateData.completed_at = null
        }

        const { data, error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', taskId)
          .select()
          .single()

        if (error) {
          throw error
        }

        return data
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ganttTasks() })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
    },
    onError: (error) => {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  })

  return {
    tasks: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    updateTaskStatus: updateTaskStatusMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending
  }
}
