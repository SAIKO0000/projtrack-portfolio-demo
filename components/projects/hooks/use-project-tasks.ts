import { useMemo, useCallback } from "react"
import { type Project } from "../types/project-types"

export const useProjectTasks = (tasks: Array<{ project_id: string; status: string }>, projects: Project[]) => {
  // Calculate task-based progress for a project
  const getProjectTaskProgress = useCallback((projectId: string) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId)
    if (projectTasks.length === 0) return 0
    
    const completedTasks = projectTasks.filter(task => task.status === 'completed')
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }, [tasks])

  // Get task counts for a project
  const getProjectTaskCounts = useCallback((projectId: string) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId)
    const completedTasks = projectTasks.filter(task => task.status === 'completed')
    return {
      total: projectTasks.length,
      completed: completedTasks.length
    }
  }, [tasks])

  const uniqueProjects = useMemo(() => 
    projects.map(p => ({ id: p.id, name: p.name })),
    [projects]
  )

  // Optimized filtered projects with memoization
  const getFilteredProjects = useCallback((searchTerm: string, statusFilter: string, projectFilter: string) => {
    return projects
      .filter((project) => {
        const matchesSearch =
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.client?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || project.status === statusFilter
        const matchesProject = projectFilter === "all" || project.id === projectFilter
        
        return matchesSearch && matchesStatus && matchesProject
      })
      .sort((a, b) => {
        const statusPriority = {
          'in-progress': 1,
          'planning': 2,
          'on-hold': 3,
          'completed': 4
        }
        
        const statusA = statusPriority[(a.status || '') as keyof typeof statusPriority] || 5
        const statusB = statusPriority[(b.status || '') as keyof typeof statusPriority] || 5
        
        if (statusA !== statusB) {
          return statusA - statusB
        }
        
        const dateA = new Date(a.end_date || a.start_date || a.created_at || '1970-01-01').getTime()
        const dateB = new Date(b.end_date || b.start_date || b.created_at || '1970-01-01').getTime()
        
        return dateB - dateA
      })
  }, [projects])

  return {
    getProjectTaskProgress,
    getProjectTaskCounts,
    uniqueProjects,
    getFilteredProjects
  }
}
