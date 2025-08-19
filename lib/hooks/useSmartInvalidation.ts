import { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '../supabase-query'
import type { Project, Task, Personnel } from '../supabase'

// Smart invalidation that only invalidates what actually changed
export const createSmartInvalidation = (queryClient: QueryClient) => ({
  
  // Instead of invalidating all projects, update cache directly
  onProjectCreate: (newProject: Project) => {
    // Optimistic update to projects list
    queryClient.setQueryData(queryKeys.projects(), (old: Project[] = []) => {
      return [newProject, ...old]
    })
    
    // Only invalidate dashboard stats, not entire dashboard
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.dashboardStats(),
      exact: true // Only this specific query
    })
  },

  onProjectUpdate: (updatedProject: Project) => {
    // Update specific project in cache
    queryClient.setQueryData(queryKeys.project(updatedProject.id), updatedProject)
    
    // Update projects list cache
    queryClient.setQueryData(queryKeys.projects(), (old: Project[] = []) => {
      return old.map(p => p.id === updatedProject.id ? updatedProject : p)
    })
    
    // NO blanket invalidation - data is already fresh
  },

  onProjectDelete: (projectId: string) => {
    // Remove from projects list cache
    queryClient.setQueryData(queryKeys.projects(), (old: Project[] = []) => {
      return old.filter(p => p.id !== projectId)
    })
    
    // Remove project-specific caches
    queryClient.removeQueries({ queryKey: queryKeys.project(projectId) })
    queryClient.removeQueries({ queryKey: queryKeys.tasksByProject(projectId) })
    queryClient.removeQueries({ queryKey: queryKeys.eventsByProject(projectId) })
    queryClient.removeQueries({ queryKey: queryKeys.reportsByProject(projectId) })
    queryClient.removeQueries({ queryKey: queryKeys.photosByProject(projectId) })
    
    // Only invalidate dashboard stats
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats(), exact: true })
  },

  onTaskCreate: (newTask: Task) => {
    // Add to tasks cache
    queryClient.setQueryData(queryKeys.tasks(), (old: Task[] = []) => {
      return [newTask, ...old]
    })
    
    // Add to project-specific tasks cache
    queryClient.setQueryData(queryKeys.tasksByProject(newTask.project_id), (old: Task[] = []) => {
      return [newTask, ...old]
    })
    
    // Only invalidate dashboard stats for progress calculation
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats(), exact: true })
  },

  onTaskUpdate: (updatedTask: Task) => {
    // Update in tasks cache
    queryClient.setQueryData(queryKeys.tasks(), (old: Task[] = []) => {
      return old.map(t => t.id === updatedTask.id ? updatedTask : t)
    })
    
    // Update in project-specific cache
    queryClient.setQueryData(queryKeys.tasksByProject(updatedTask.project_id), (old: Task[] = []) => {
      return old.map(t => t.id === updatedTask.id ? updatedTask : t)
    })
    
    // Only invalidate dashboard stats if status changed
    if (updatedTask.status) {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats(), exact: true })
    }
  },

  onTaskDelete: (taskId: string, projectId: string) => {
    // Remove from tasks cache
    queryClient.setQueryData(queryKeys.tasks(), (old: Task[] = []) => {
      return old.filter(t => t.id !== taskId)
    })
    
    // Remove from project-specific cache
    queryClient.setQueryData(queryKeys.tasksByProject(projectId), (old: Task[] = []) => {
      return old.filter(t => t.id !== taskId)
    })
    
    // Only invalidate dashboard stats
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats(), exact: true })
  },

  // For personnel (rarely changes - long cache times)
  onPersonnelUpdate: (updatedPersonnel: Personnel) => {
    queryClient.setQueryData(queryKeys.personnel(), (old: Personnel[] = []) => {
      return old.map(p => p.id === updatedPersonnel.id ? updatedPersonnel : p)
    })
    // No other invalidation needed
  }
})
