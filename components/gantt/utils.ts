import { EnhancedTask, TimelineMonth, TaskPosition } from "./types"

// Parse task date in local timezone to prevent timezone conversion issues
export const parseTaskDate = (dateString: string) => {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed
}

// Check if task is overdue
export const isOverdue = (endDate: string | null, status: string | null): boolean => {
  if (status === "completed" || !endDate) return false
  const taskEndDate = parseTaskDate(endDate)
  // Get current date in Philippines timezone properly
  const now = new Date()
  const philippinesOffset = 8 * 60 // Philippines is UTC+8
  const localOffset = now.getTimezoneOffset()
  const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
  const today = new Date(philippinesTime.getFullYear(), philippinesTime.getMonth(), philippinesTime.getDate())
  return taskEndDate < today
}

// Get days until deadline
export const getDaysUntilDeadline = (endDate: string | null, status: string | null): number | null => {
  if (status === "completed" || !endDate) return null
  const taskEndDate = parseTaskDate(endDate)
  // Get current date in Philippines timezone properly
  const now = new Date()
  const philippinesOffset = 8 * 60 // Philippines is UTC+8
  const localOffset = now.getTimezoneOffset()
  const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
  const today = new Date(philippinesTime.getFullYear(), philippinesTime.getMonth(), philippinesTime.getDate())
  const diffTime = taskEndDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Get effective status considering overdue
export const getEffectiveStatus = (status: string | null, isOverdue: boolean): string | null => {
  // If task is overdue and not completed, show as delayed
  if (isOverdue && status !== "completed") {
    return "delayed"
  }
  return status
}

// Get status styling
export const getStatusColor = (status: string | null, isOverdue: boolean = false): string => {
  const effectiveStatus = getEffectiveStatus(status, isOverdue)
  
  switch (effectiveStatus) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "in-progress":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    case "planning":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "on-hold":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "delayed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

// Get status icon type identifier
export const getStatusIconType = (status: string | null, isOverdue: boolean = false): string => {
  const effectiveStatus = getEffectiveStatus(status, isOverdue)
  
  switch (effectiveStatus) {
    case "completed":
      return "completed"
    case "in-progress":
      return "in-progress"
    case "planning":
      return "planning"
    case "on-hold":
      return "on-hold"
    case "delayed":
      return "delayed"
    default:
      return "default"
  }
}

// Get project bar color
export const getProjectBarColor = (status: string | null, overdue: boolean): string => {
  if (overdue) return "bg-red-500 border-red-600"
  
  switch (status) {
    case "completed":
      return "bg-green-500 border-green-600"
    case "in-progress":
      return "bg-orange-500 border-orange-600"
    case "on-hold":
      return "bg-yellow-500 border-yellow-600"
    default:
      return "bg-blue-500 border-blue-600"
  }
}

// Format date with timezone handling
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A"
  // Parse date in local timezone to prevent timezone conversion issues
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
  const localDate = new Date(year, month - 1, day) // month is 0-indexed
  return localDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila"
  })
}

// Get task position in timeline
export const getTaskPosition = (task: EnhancedTask, timelineMonths: TimelineMonth[]): TaskPosition => {
  if (!task.start_date || !task.end_date) {
    return { left: "0%", width: "0%", isVisible: false, actualStart: null, actualEnd: null }
  }

  const startDate = parseTaskDate(task.start_date)
  const endDate = parseTaskDate(task.end_date)
  const timelineStart = timelineMonths[0].date
  const timelineEnd = timelineMonths[timelineMonths.length - 1].endDate ||
    new Date(
      timelineMonths[timelineMonths.length - 1].date.getFullYear(),
      timelineMonths[timelineMonths.length - 1].date.getMonth() + 1,
      0,
    )

  const totalDuration = timelineEnd.getTime() - timelineStart.getTime()
  const taskStartOffset = Math.max(0, startDate.getTime() - timelineStart.getTime())
  const taskStart = (taskStartOffset / totalDuration) * 100
  const taskEndOffset = Math.min(totalDuration, endDate.getTime() - timelineStart.getTime())
  const taskEnd = (taskEndOffset / totalDuration) * 100
  const taskWidth = Math.max(1, taskEnd - taskStart)

  return {
    left: `${Math.max(0, Math.min(100, taskStart))}%`,
    width: `${Math.max(1, Math.min(100 - taskStart, taskWidth))}%`,
    isVisible: taskEnd > 0 && taskStart < 100,
    actualStart: startDate,
    actualEnd: endDate,
  }
}
