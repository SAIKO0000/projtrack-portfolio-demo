import { useMemo } from "react"
import { type Project, type Task, type Personnel } from "@/lib/supabase"

export const useDashboardAnalytics = (projects: Project[], tasks: Task[], personnel: Personnel[]) => {
  // Calculate task-based progress for a project
  const getProjectTaskProgress = useMemo(() => 
    (projectId: string) => {
      const projectTasks = tasks.filter(task => task.project_id === projectId)
      if (projectTasks.length === 0) return 0
      
      const completedTasks = projectTasks.filter(task => task.status === 'completed')
      return Math.round((completedTasks.length / projectTasks.length) * 100)
    }, [tasks]
  )

  // Get task counts for a project
  const getProjectTaskCounts = useMemo(() => 
    (projectId: string) => {
      const projectTasks = tasks.filter(task => task.project_id === projectId)
      const completedTasks = projectTasks.filter(task => task.status === 'completed')
      return {
        total: projectTasks.length,
        completed: completedTasks.length
      }
    }, [tasks]
  )
  
  // Calculate statistics with optimized performance
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'in-progress').length
    
    const now = new Date()
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      return new Date(t.due_date) < now
    }).length

    // Calculate accurate completion rate based on task progress across all projects
    const completionRate = projects.length > 0 
      ? Math.round(
          projects.reduce((acc, project) => {
            return acc + getProjectTaskProgress(project.id)
          }, 0) / projects.length
        )
      : 0

    return {
      activeProjects,
      overdueTasks, 
      completionRate,
      totalPersonnel: personnel.length
    }
  }, [projects, tasks, personnel, getProjectTaskProgress])

  // Calculate comprehensive project analytics
  const projectAnalytics = useMemo(() => {
    const analytics = {
      total: projects.length,
      completed: projects.filter(p => p.status === 'completed').length,
      inProgress: projects.filter(p => p.status === 'in-progress').length,
      planning: projects.filter(p => p.status === 'planning').length,
      onHold: projects.filter(p => p.status === 'on-hold').length,
      avgCompletion: 0,
      projectsWithTasks: 0,
      overallProgress: 0
    }

    // Calculate average completion rate across all projects
    if (projects.length > 0) {
      const progressSum = projects.reduce((sum, project) => {
        const progress = getProjectTaskProgress(project.id)
        if (progress > 0) analytics.projectsWithTasks += 1
        return sum + progress
      }, 0)
      
      analytics.avgCompletion = Math.round(progressSum / projects.length)
      analytics.overallProgress = analytics.avgCompletion
    }

    return analytics
  }, [projects, getProjectTaskProgress])

  return {
    stats,
    projectAnalytics,
    getProjectTaskProgress,
    getProjectTaskCounts
  }
}
