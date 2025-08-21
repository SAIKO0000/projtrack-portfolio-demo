import { useMemo } from "react"
import { type Project } from "@/lib/supabase"

export const useChartData = (projects: Project[], getProjectTaskProgress: (projectId: string) => number) => {
  // Calculate dynamic project progress data based on actual project timelines
  const getProjectProgressData = useMemo(() => {
    const monthsData = new Map()
    const now = new Date()
    
    // Get last 6 months for better visualization
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      monthsData.set(monthKey, { 
        name: monthKey, 
        completed: 0, 
        ongoing: 0, 
        started: 0
      })
    }

    // Helper function to get completion month for a project
    const getCompletionMonth = (project: Project) => {
      // Priority: end_date > updated_at > created_at > current month
      if (project.end_date) {
        return new Date(project.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      }
      if (project.updated_at) {
        return new Date(project.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      }
      if (project.created_at) {
        return new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      }
      return now.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    }

    // Process each project
    projects.forEach(project => {
      const projectProgress = getProjectTaskProgress(project.id)
      
      // Track when projects started
      if (project.start_date) {
        const startDate = new Date(project.start_date)
        const startMonth = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        
        if (monthsData.has(startMonth)) {
          monthsData.get(startMonth).started += 1
        }
      }

      // Track completed projects - either by status or by 100% task completion
      const isProjectCompleted = project.status === 'completed' || projectProgress === 100
      if (isProjectCompleted) {
        const completionMonth = getCompletionMonth(project)
        if (monthsData.has(completionMonth)) {
          monthsData.get(completionMonth).completed += 1
        }
      }

      // Track ongoing projects in current month only
      if (project.status === 'in-progress') {
        const currentMonth = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        if (monthsData.has(currentMonth)) {
          monthsData.get(currentMonth).ongoing += 1
        }
      }
    })

    return Array.from(monthsData.values())
  }, [projects, getProjectTaskProgress])

  // Enhanced status distribution data for pie chart with all projects
  const statusData = useMemo(() => {
    const completed = projects.filter(p => p.status === 'completed').length
    const inProgress = projects.filter(p => p.status === 'in-progress').length
    const planning = projects.filter(p => p.status === 'planning').length
    const onHold = projects.filter(p => p.status === 'on-hold').length

    return [
      { 
        name: "Completed", 
        value: completed,
        color: "#10B981" 
      },
      { 
        name: "In Progress", 
        value: inProgress,
        color: "#FF6B35" 
      },
      { 
        name: "Planning", 
        value: planning,
        color: "#3B82F6" 
      },
      { 
        name: "On Hold", 
        value: onHold,
        color: "#F59E0B" 
      },
    ].filter(item => item.value > 0) // Only show statuses that have projects
  }, [projects])

  return {
    projectProgressData: getProjectProgressData,
    statusData
  }
}
