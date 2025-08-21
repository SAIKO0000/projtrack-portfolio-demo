import { useMemo } from "react"
import { type Project, type Task } from "@/lib/supabase"
import { getTaskStatusColor, formatTaskDate } from "./dashboard-utils"

export const useTaskManagement = (tasks: Task[], projects: Project[]) => {
  // Get optimized upcoming tasks - prioritized by due date and status
  const getUpcomingTasks = useMemo(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return tasks
      .filter(task => {
        // Include tasks that are not completed
        if (task.status === 'completed') return false
        
        // Include tasks with upcoming due dates or overdue tasks
        if (task.due_date) {
          const dueDate = new Date(task.due_date)
          // Show tasks due within next 2 weeks or overdue tasks
          const twoWeeksFromNow = new Date(now)
          twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)
          return dueDate <= twoWeeksFromNow
        }
        
        // Include high priority tasks without due dates
        return task.priority === 'high'
      })
      .map(task => {
        const project = projects.find(p => p.id === task.project_id)
        const dueDate = task.due_date ? new Date(task.due_date) : null
        const isOverdue = dueDate ? dueDate < now && task.status !== 'completed' : false
        const isToday = dueDate ? 
          dueDate.toDateString() === now.toDateString() : false
        const isTomorrow = dueDate ? 
          dueDate.toDateString() === tomorrow.toDateString() : false
        
        let urgencyScore = 0
        if (isOverdue) urgencyScore = 100
        else if (isToday) urgencyScore = 90
        else if (isTomorrow) urgencyScore = 80
        else if (task.priority === 'high') urgencyScore = 70
        else if (task.priority === 'medium') urgencyScore = 50
        else urgencyScore = 30

        // Add days until due date for sorting
        const daysUntilDue = dueDate ? 
          Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999

        return {
          ...task,
          project_name: project?.name || 'Unknown Project',
          project_client: project?.client,
          isOverdue,
          isToday,
          isTomorrow,
          urgencyScore,
          daysUntilDue
        }
      })
      .sort((a, b) => {
        // Sort by urgency score first, then by days until due
        if (a.urgencyScore !== b.urgencyScore) {
          return b.urgencyScore - a.urgencyScore
        }
        return a.daysUntilDue - b.daysUntilDue
      })
      .slice(0, 6) // Show top 6 most urgent tasks
  }, [tasks, projects])

  const getTaskUrgencyBadgeProps = (task: Task & { isOverdue?: boolean; isToday?: boolean; isTomorrow?: boolean; priority?: string; status?: string }) => {
    if (task.isOverdue) {
      return { className: "bg-red-100 text-red-800", text: "Overdue" }
    }
    if (task.isToday) {
      return { className: "bg-orange-100 text-orange-800", text: "Due Today" }
    }
    if (task.isTomorrow) {
      return { className: "bg-yellow-100 text-yellow-800", text: "Due Tomorrow" }
    }
    // Show task status instead of priority
    const status = task.status || 'unknown'
    return { 
      className: getTaskStatusColor(status), 
      text: status.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
  }

  return {
    upcomingTasks: getUpcomingTasks,
    getTaskUrgencyBadgeProps,
    formatTaskDate
  }
}
