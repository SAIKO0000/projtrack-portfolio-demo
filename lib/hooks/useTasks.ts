import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { toast } from 'react-hot-toast'
import type { Database } from '../supabase.types'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Create tasks query options for reuse
const tasksQueryOptions = {
  queryKey: ['tasks'],
  queryFn: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return data || []
  },
  staleTime: 1000 * 60 * 5, // 5 minutes
  refetchOnWindowFocus: false,
}

export function useTasks() {
  const queryClient = useQueryClient()

  // Fetch tasks query
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch
  } = useQuery(tasksQueryOptions)

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: TaskInsert): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create task: ${error.message}`)
      }

      return data
    },
    onSuccess: (newTask) => {
      // Optimistic update: Add to cache immediately
      queryClient.setQueryData<Task[]>(['tasks'], (oldTasks = []) => [
        newTask,
        ...oldTasks
      ])
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      toast.success('Task created successfully!')
    },
    onError: (error) => {
      console.error('Error creating task:', error)
      toast.error(`Failed to create task: ${error.message}`)
    }
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TaskUpdate }): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update task: ${error.message}`)
      }

      return data
    },
    onSuccess: (updatedTask) => {
      // Optimistic update: Update in cache immediately
      queryClient.setQueryData<Task[]>(['tasks'], (oldTasks = []) =>
        oldTasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      )
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      toast.success('Task updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating task:', error)
      toast.error(`Failed to update task: ${error.message}`)
    }
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        throw new Error(`Failed to delete task: ${error.message}`)
      }
    },
    onSuccess: (_, taskId) => {
      // Optimistic update: Remove from cache immediately
      queryClient.setQueryData<Task[]>(['tasks'], (oldTasks = []) =>
        oldTasks.filter(task => task.id !== taskId)
      )
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      toast.success('Task deleted successfully!')
    },
    onError: (error) => {
      console.error('Error deleting task:', error)
      toast.error(`Failed to delete task: ${error.message}`)
    }
  })

  return {
    // Data
    tasks,
    isLoading,
    error: error as Error | null,
    
    // Actions
    refetch,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    
    // Mutation states
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    
    // Async actions (for await usage)
    createTaskAsync: createTaskMutation.mutateAsync,
    updateTaskAsync: updateTaskMutation.mutateAsync,
    deleteTaskAsync: deleteTaskMutation.mutateAsync,
  }
}
