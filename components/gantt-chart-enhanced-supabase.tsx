"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProjects } from "@/lib/hooks/useProjects"
import { useGanttTasksOptimized } from "@/lib/hooks/useGanttTasksOptimized"
import { TaskFormModalOptimized } from "./task-form-modal-optimized"
import { TaskEditModalOptimized } from "./task-edit-modal-optimized"
import { TaskNotesModal } from "./task-notes-modal"
import { StructuredExportControls } from "./structured-export-controls"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { useStructuredExport } from "@/lib/hooks/useStructuredExport"
import { toast } from "react-hot-toast"
import {
  BarChart3,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  RefreshCw,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  StickyNote,
  FileText,
} from "lucide-react"

interface EnhancedTask {
  // Core task properties from database
  id: string
  title: string
  description: string | null
  project_id: string | null
  start_date: string | null
  end_date: string | null
  status: string | null
  priority: string | null
  assignee: string | null
  assigned_to: string | null
  assignee_headcounts: Record<string, number> | null
  category: string | null
  created_at: string | null
  dependencies: string[] | null
  due_date: string | null
  duration: number | null
  estimated_hours: number | null
  gantt_position: number | null
  name: string | null
  phase: string | null
  progress: number | null
  updated_at: string | null
  completed_at: string | null
  notes: string | null
  // Enhanced properties
  project_name?: string
  project_client?: string | null
  is_overdue?: boolean
  days_until_deadline?: number | null
  dependencyTasks?: EnhancedTask[]
  // New alphabetical ID
  alphabetical_id?: string
}

interface TimelineMonth {
  label: string
  date: Date
  endDate: Date
  quarter: number
  year: number
  isQuarter: boolean
}

interface GanttChartEnhancedProps {
  readonly selectedProjectId?: string | null
}

export function GanttChartEnhanced({ selectedProjectId }: GanttChartEnhancedProps) {
  const { projects, loading: projectsLoading, error: projectsError, fetchProjects } = useProjects()
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks, deleteTask, updateTaskStatus } = useGanttTasksOptimized()
  
  // Status formatting function
  const formatStatus = (status: string | null, overdue: boolean = false): string => {
    if (overdue) return "Overdue"
    if (!status) return "Unknown"
    
    // Split by dash and capitalize each word
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
  // Transform tasks for export compatibility
  const transformedTasks = useMemo(() => {
    return (tasks || []).map(task => {
      const t = task as unknown as Record<string, unknown>; // Type casting to access properties
      return {
        id: String(t.id || ''),
        title: String(t.title || ''),
        description: t.description ? String(t.description) : undefined,
        project_id: String(t.project_id || ''),
        project_name: t.project_name ? String(t.project_name) : undefined,
        start_date: t.start_date ? String(t.start_date) : undefined,
        end_date: t.end_date ? String(t.end_date) : undefined,
        status: String(t.status || 'unknown'),
        priority: t.priority ? String(t.priority) : undefined,
        assignee: t.assignee ? String(t.assignee) : (t.assigned_to ? String(t.assigned_to) : undefined),
        progress: typeof t.progress === 'number' ? t.progress : 0,
        phase: t.phase ? String(t.phase) : undefined,
        category: t.category ? String(t.category) : undefined,
        estimated_hours: typeof t.estimated_hours === 'number' ? t.estimated_hours : undefined,
        is_overdue: Boolean(t.is_overdue),
        days_until_deadline: typeof t.days_until_deadline === 'number' ? t.days_until_deadline : undefined,
        completed_at: t.completed_at ? String(t.completed_at) : undefined,
        notes: t.notes ? String(t.notes) : undefined,
        assignee_headcounts: t.assignee_headcounts as Record<string, number> || undefined
      }
    })
  }, [tasks])

  const { exportStructuredReport, isExporting } = useStructuredExport({
    projects: projects || [],
    tasks: transformedTasks
  })
  
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [currentPeriod, setCurrentPeriod] = useState(new Date())
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly" | "full">("weekly")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingTask, setEditingTask] = useState<EnhancedTask | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [notesTask, setNotesTask] = useState<EnhancedTask | null>(null)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [deletingTask, setDeletingTask] = useState<EnhancedTask | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingTask, setIsDeletingTask] = useState(false)
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set())
  
  // Set project filter when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      setProjectFilter(selectedProjectId)
    }
  }, [selectedProjectId])

  // Helper function to generate alphabetical ID
  const generateAlphabeticalId = useCallback((tasks: EnhancedTask[]) => {
    // Sort tasks by creation date (ascending)
    const sortedTasks = [...tasks].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateA - dateB
    })

    // Generate alphabetical IDs
    return sortedTasks.map((task, index) => {
      let alphabeticalId = ''
      let tempIndex = index
      
      // Convert index to alphabetical format (A, B, C, ..., Z, AA, AB, ...)
      do {
        alphabeticalId = String.fromCharCode(65 + (tempIndex % 26)) + alphabeticalId
        tempIndex = Math.floor(tempIndex / 26)
      } while (tempIndex > 0)
      
      return {
        ...task,
        alphabetical_id: alphabeticalId
      }
    })
  }, [])

  // Get current Philippines time consistently
  const getCurrentPhilippinesTime = useCallback(() => {
    const now = new Date()
    const philippinesOffset = 8 * 60 // Philippines is UTC+8
    const localOffset = now.getTimezoneOffset()
    const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
    return new Date(philippinesTime.getFullYear(), philippinesTime.getMonth(), philippinesTime.getDate())
  }, [])

  // Helper function to toggle collapse state
  const toggleTaskCollapse = useCallback((taskId: string) => {
    setCollapsedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }, [])

  // Helper functions defined before they're used
  const parseTaskDate = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }

  const isOverdue = useCallback((endDate: string | null, status: string | null) => {
    if (status === "completed" || !endDate) return false
    const taskEndDate = parseTaskDate(endDate)
    // Get current date in Philippines timezone properly
    const now = new Date()
    const philippinesOffset = 8 * 60 // Philippines is UTC+8
    const localOffset = now.getTimezoneOffset()
    const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
    const today = new Date(philippinesTime.getFullYear(), philippinesTime.getMonth(), philippinesTime.getDate())
    return taskEndDate < today
  }, [])

  const getDaysUntilDeadline = useCallback((endDate: string | null, status: string | null) => {
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
  }, [])

  // Transform tasks data to include project information and alphabetical IDs
  const enhancedTasks: EnhancedTask[] = useMemo(() => {
    const tasksWithInfo = tasks.map(task => {
      const taskData = task as EnhancedTask
      const project = projects.find(p => p.id === taskData.project_id)
      return {
        ...taskData,
        project_name: project?.name || 'Unknown Project',
        project_client: project?.client || null,
        is_overdue: isOverdue(taskData.end_date, taskData.status),
        days_until_deadline: getDaysUntilDeadline(taskData.end_date, taskData.status)
      }
    })
    
    // Generate alphabetical IDs based on creation time
    return generateAlphabeticalId(tasksWithInfo)
  }, [tasks, projects, isOverdue, getDaysUntilDeadline, generateAlphabeticalId])

  const getEffectiveStatus = (status: string | null, isOverdue: boolean) => {
    // If task is overdue and not completed, show as delayed
    if (isOverdue && status !== "completed") {
      return "delayed"
    }
    return status
  }

  const getStatusColor = (status: string | null, isOverdue: boolean = false) => {
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

  const getStatusIcon = (status: string | null, isOverdue: boolean = false) => {
    const effectiveStatus = getEffectiveStatus(status, isOverdue)
    
    switch (effectiveStatus) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Play className="h-4 w-4 text-orange-500" />
      case "planning":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "on-hold":
        return <Pause className="h-4 w-4 text-yellow-500" />
      case "delayed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getProjectBarColor = (status: string | null, overdue: boolean) => {
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

  const getFullTimelineRange = () => {
    if (enhancedTasks.length === 0) {
      return { start: new Date(), end: new Date() }
    }

    const tasksWithDates = enhancedTasks.filter(t => t.start_date && t.end_date)
    if (tasksWithDates.length === 0) {
      return { start: new Date(), end: new Date() }
    }

    const startDates = tasksWithDates.map((t) => new Date(t.start_date!))
    const endDates = tasksWithDates.map((t) => new Date(t.end_date!))

    const earliestStart = new Date(Math.min(...startDates.map((d) => d.getTime())))
    const latestEnd = new Date(Math.max(...endDates.map((d) => d.getTime())))

    return { start: earliestStart, end: latestEnd }
  }

  const getTimelineMonths = () => {
    const months = []
    
    // Get the project's actual task date range
    const getProjectTaskDateRange = () => {
      if (!selectedProjectId) return null
      
      const projectTasks = enhancedTasks.filter(task => task.project_id === selectedProjectId)
      if (projectTasks.length === 0) return null
      
      const dates = projectTasks
        .filter(task => task.start_date && task.end_date)
        .flatMap(task => [new Date(task.start_date!), new Date(task.end_date!)])
      
      if (dates.length === 0) return null
      
      const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())))
      const latestDate = new Date(Math.max(...dates.map(d => d.getTime())))
      
      return { start: earliestDate, end: latestDate }
    }

    if (viewMode === "full") {
      // Full timeline - show only months that contain tasks
      let { start, end } = getFullTimelineRange()
      
      // If we have enhanced tasks, use their exact range
      if (enhancedTasks.length > 0) {
        const allTaskDates = enhancedTasks
          .filter(task => task.start_date && task.end_date)
          .flatMap(task => [new Date(task.start_date!), new Date(task.end_date!)])
        
        if (allTaskDates.length > 0) {
          start = new Date(Math.min(...allTaskDates.map(d => d.getTime())))
          end = new Date(Math.max(...allTaskDates.map(d => d.getTime())))
        }
      }
      
      // Start from today if project starts in the past, otherwise use project start
      const today = getCurrentPhilippinesTime()
      const startDate = new Date(Math.max(start.getTime(), today.getTime()))
      
      // Use exact end date without buffer
      const endDate = new Date(end.getFullYear(), end.getMonth(), 1)

      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      
      // For full timeline, show monthly view with exact intervals
      while (currentDate <= endDate) {
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        months.push({
          label: currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          date: new Date(currentDate),
          endDate: new Date(monthEnd),
          quarter: Math.floor(currentDate.getMonth() / 3) + 1,
          year: currentDate.getFullYear(),
          isQuarter: false,
        })

        currentDate.setMonth(currentDate.getMonth() + 1)
      }
    } else if (viewMode === "weekly") {
      // Weekly view - show specific weeks in chronological order starting from Week 1
      const projectTaskRange = getProjectTaskDateRange()
      let startOfPeriod = getCurrentPhilippinesTime()
      
      // If we have a specific project, start from the earliest task date or today, whichever is later
      if (projectTaskRange && selectedProjectId) {
        startOfPeriod = new Date(Math.max(projectTaskRange.start.getTime(), getCurrentPhilippinesTime().getTime()))
      }
      
      // Find the first day of the month containing our start date
      const startOfMonth = new Date(startOfPeriod.getFullYear(), startOfPeriod.getMonth(), 1)
      
      // Find the Sunday of the first week that includes the 1st of the month
      const firstSunday = new Date(startOfMonth)
      const dayOfWeek = startOfMonth.getDay()
      if (dayOfWeek !== 0) { // If not Sunday
        firstSunday.setDate(startOfMonth.getDate() - dayOfWeek)
      }
      firstSunday.setHours(0, 0, 0, 0)
      
      // Calculate how many weeks we need to show
      let weeksToShow = 8 // Default 8 weeks
      if (projectTaskRange && selectedProjectId) {
        const endOfMonth = new Date(projectTaskRange.end.getFullYear(), projectTaskRange.end.getMonth() + 1, 0)
        const weeksDiff = Math.ceil((endOfMonth.getTime() - firstSunday.getTime()) / (1000 * 60 * 60 * 24 * 7))
        weeksToShow = Math.min(Math.max(weeksDiff, 4), 16) // Min 4 weeks, max 16 weeks
      }
      
      for (let weekNum = 0; weekNum < weeksToShow; weekNum++) {
        const weekStart = new Date(firstSunday)
        weekStart.setDate(firstSunday.getDate() + weekNum * 7)
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        // Calculate week number within the month more accurately
        const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1)
        const monthEnd = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0)
        
        // Check if this week contains any days of the current month
        const weekContainsMonthDays = weekStart <= monthEnd && weekEnd >= monthStart
        
        let weekNumber = 1
        if (weekContainsMonthDays) {
          // Calculate which week of the month this is based on the first day of the month
          const firstOfMonth = new Date(monthStart)
          const firstDayOfWeek = firstOfMonth.getDay() // 0 = Sunday, 1 = Monday, etc.
          
          // Find the first Sunday of the month or before
          const firstSundayOfMonth = new Date(firstOfMonth)
          if (firstDayOfWeek !== 0) {
            firstSundayOfMonth.setDate(firstOfMonth.getDate() - firstDayOfWeek)
          }
          
          // Calculate week number based on how many weeks have passed since the first Sunday
          const daysDiff = Math.floor((weekStart.getTime() - firstSundayOfMonth.getTime()) / (1000 * 60 * 60 * 24))
          weekNumber = Math.floor(daysDiff / 7) + 1
          
          // If the week starts before the month, but contains days of the month, it's week 1
          if (weekStart < monthStart && weekEnd >= monthStart) {
            weekNumber = 1
          }
        }
        
        // Ensure week number is at least 1 and handle month transitions correctly
        weekNumber = Math.max(1, weekNumber)
        
        const monthLabel = weekStart.toLocaleDateString("en-US", { month: "short" })
        
        months.push({
          label: `${monthLabel} Week ${weekNumber}`,
          date: new Date(weekStart),
          endDate: new Date(weekEnd),
          quarter: 1,
          year: weekStart.getFullYear(),
          isQuarter: false,
        })
      }
    } else if (viewMode === "monthly") {
      // Monthly view - show only months that contain tasks, no extra months
      const projectTaskRange = getProjectTaskDateRange()
      let startDate = new Date(getCurrentPhilippinesTime().getFullYear(), getCurrentPhilippinesTime().getMonth(), 1)
      let endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 12, 0) // Default 12 months
      
      // If we have a specific project, adjust start and end dates
      if (projectTaskRange && selectedProjectId) {
        const projectStartMonth = new Date(projectTaskRange.start.getFullYear(), projectTaskRange.start.getMonth(), 1)
        const todayMonth = new Date(getCurrentPhilippinesTime().getFullYear(), getCurrentPhilippinesTime().getMonth(), 1)
        startDate = new Date(Math.max(projectStartMonth.getTime(), todayMonth.getTime()))
        
        // End at the exact month of the latest task, no buffer
        endDate = new Date(projectTaskRange.end.getFullYear(), projectTaskRange.end.getMonth(), 1)
      } else if (enhancedTasks.length > 0) {
        // Use exact task range if no specific project
        const allTaskDates = enhancedTasks
          .filter(task => task.start_date && task.end_date)
          .flatMap(task => [new Date(task.start_date!), new Date(task.end_date!)])
        
        if (allTaskDates.length > 0) {
          const minDate = new Date(Math.min(...allTaskDates.map(d => d.getTime())))
          const maxDate = new Date(Math.max(...allTaskDates.map(d => d.getTime())))
          
          const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
          const todayMonth = new Date(getCurrentPhilippinesTime().getFullYear(), getCurrentPhilippinesTime().getMonth(), 1)
          startDate = new Date(Math.max(minMonth.getTime(), todayMonth.getTime()))
          endDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
        }
      }
      
      // Calculate exact number of months needed
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth()) + 1
      const monthsToShow = Math.min(Math.max(monthsDiff, 3), 24) // Min 3 months, max 24 months
      
      for (let i = 0; i < monthsToShow; i++) {
        const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
        const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0)
        monthEnd.setHours(23, 59, 59, 999)
        
        months.push({
          label: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          date: new Date(monthStart),
          endDate: new Date(monthEnd),
          quarter: Math.floor(monthStart.getMonth() / 3) + 1,
          year: monthStart.getFullYear(),
          isQuarter: false,
        })
      }
    } else if (viewMode === "daily") {
      // Daily view - show exact date range from task dates without buffer
      const projectTaskRange = getProjectTaskDateRange()
      let startDate = getCurrentPhilippinesTime()
      let endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 21) // Default 21 days
      
      if (projectTaskRange && selectedProjectId) {
        // Use exact project task range
        startDate = new Date(Math.max(projectTaskRange.start.getTime(), getCurrentPhilippinesTime().getTime()))
        endDate = new Date(projectTaskRange.end.getTime()) // Use exact end date without buffer
      } else if (enhancedTasks.length > 0) {
        // Use exact all tasks range if no specific project
        const allTaskDates = enhancedTasks
          .filter(task => task.start_date && task.end_date)
          .flatMap(task => [new Date(task.start_date!), new Date(task.end_date!)])
        
        if (allTaskDates.length > 0) {
          const minDate = new Date(Math.min(...allTaskDates.map(d => d.getTime())))
          const maxDate = new Date(Math.max(...allTaskDates.map(d => d.getTime())))
          
          startDate = new Date(Math.max(minDate.getTime(), getCurrentPhilippinesTime().getTime()))
          endDate = new Date(maxDate.getTime()) // Use exact end date without buffer
        }
      }
      
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const daysToShow = Math.min(Math.max(totalDays, 7), 60) // Min 7 days, max 60 days
      
      for (let i = 0; i < daysToShow; i++) {
        const dayDate = new Date(startDate)
        dayDate.setDate(startDate.getDate() + i)
        
        months.push({
          label: dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          date: new Date(dayDate),
          endDate: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59),
          quarter: 1,
          year: dayDate.getFullYear(),
          isQuarter: false,
        })
      }
    }

    return months
  }

  const getTaskPosition = (task: EnhancedTask, timelineMonths: TimelineMonth[]) => {
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

  const filteredTasks = enhancedTasks.filter((task) => {
    const taskIsOverdue = isOverdue(task.end_date, task.status)
    const effectiveStatus = getEffectiveStatus(task.status, taskIsOverdue)
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "delayed" ? effectiveStatus === "delayed" : task.status === statusFilter)
    const matchesProject = projectFilter === "all" || task.project_id === projectFilter
    const matchesSearch =
      searchTerm === "" ||
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project_client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesProject && matchesSearch
  })

  const timelineMonths = getTimelineMonths()

  const navigatePeriod = (direction: "prev" | "next") => {
    const newPeriod = new Date(currentPeriod)
    
    if (viewMode === "daily") {
      newPeriod.setDate(newPeriod.getDate() + (direction === "next" ? 1 : -1))
    } else if (viewMode === "weekly") {
      // Navigate by 4 weeks (28 days) to show the next/previous set of 4 weeks
      newPeriod.setDate(newPeriod.getDate() + (direction === "next" ? 28 : -28))
    } else if (viewMode === "monthly") {
      // Navigate by 1 month to show the next/previous month
      newPeriod.setMonth(newPeriod.getMonth() + (direction === "next" ? 1 : -1))
    }
    // For "full" mode, navigation is not applicable as it shows entire timeline
    
    setCurrentPeriod(newPeriod)
  }

  const formatDate = (dateString: string | null) => {
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

  const handleEditTask = (task: EnhancedTask) => {
    setEditingTask(task)
    setIsEditModalOpen(true)
  }

  const handleNotesTask = (task: EnhancedTask) => {
    setNotesTask(task)
    setIsNotesModalOpen(true)
  }

  const handleNotesSubmit = async (taskId: string, notes: string) => {
    try {
      const response = await fetch('/api/tasks/update-notes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, notes }),
      })

      if (!response.ok) {
        throw new Error('Failed to update notes')
      }

      // Refresh tasks to show updated notes
      await refetchTasks()
      setIsNotesModalOpen(false)
      setNotesTask(null)
    } catch (error) {
      console.error('Error updating notes:', error)
      throw error
    }
  }

  const handleTaskReport = async (task: EnhancedTask) => {
    try {
      const project = projects.find(p => p.id === task.project_id)
      await exportStructuredReport({
        exportType: 'specific-project',
        projectId: task.project_id || undefined,
        includeTaskDetails: true,
        includeResourceAnalysis: true,
        includeTimeline: true,
        includeTechnicalSpecs: true
      })
    } catch (error) {
      console.error('Error generating task report:', error)
      toast.error('Failed to generate task report')
    }
  }

  const handleDeleteTask = (task: EnhancedTask) => {
    setDeletingTask(task)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!deletingTask) return
    
    setIsDeletingTask(true)
    try {
      await deleteTask(deletingTask.id)
      toast.success("Task deleted successfully!")
      setIsDeleteDialogOpen(false)
      setDeletingTask(null)
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task. Please try again.")
    } finally {
      setIsDeletingTask(false)
    }
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setDeletingTask(null)
  }

  const handleTaskUpdated = () => {
    refetchTasks()
    setEditingTask(null)
    setIsEditModalOpen(false)
  }

  const handleStructuredExport = useCallback(async (options: {
    exportType: 'all-projects' | 'specific-project'
    projectId?: string
    includeTaskDetails?: boolean
    includeResourceAnalysis?: boolean
    includeTimeline?: boolean
    includeTechnicalSpecs?: boolean
  }) => {
    try {
      // Provide default values to ensure all required fields are present
      const exportOptions = {
        exportType: options.exportType,
        projectId: options.projectId,
        includeTaskDetails: options.includeTaskDetails ?? true,
        includeResourceAnalysis: options.includeResourceAnalysis ?? true,
        includeTimeline: options.includeTimeline ?? true,
        includeTechnicalSpecs: options.includeTechnicalSpecs ?? true
      }
      await exportStructuredReport(exportOptions)
    } catch (error) {
      console.error('Structured export failed:', error)
      toast.error('Export failed. Please try again.')
    }
  }, [exportStructuredReport])

  const overallStats = useMemo(() => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter((t) => t.status === "completed").length
    const inProgress = filteredTasks.filter((t) => t.status === "in-progress").length
    const delayed = filteredTasks.filter((t) => {
      const taskIsOverdue = isOverdue(t.end_date, t.status)
      return getEffectiveStatus(t.status, taskIsOverdue) === "delayed"
    }).length
    const avgProgress = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, delayed, avgProgress }
  }, [filteredTasks, isOverdue])

  if (projectsLoading || tasksLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading tasks...</span>
        </div>
      </div>
    )
  }

  if (projectsError || tasksError) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading data: {projectsError || tasksError}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-5 lg:p-9 space-y-3 sm:space-y-5 lg:space-y-7 overflow-y-auto h-full bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
      {/* Modern Header with Glassmorphism */}
      <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-5 lg:p-7 rounded-xl shadow-lg border border-gray-200/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-5xl font-bold text-gray-900">Project Scheduling</h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">
                  Visual timeline management with advanced tracking
                </p>
              </div>
            </div>
          </div>
          {/* Enhanced Live Updates indicator */}
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200/50">
              <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
              <span className="text-sm font-medium text-emerald-700">Live Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-7">
        <Card className="border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Tasks</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{overallStats.total}</p>
                <p className="text-sm text-gray-600">In timeline</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{overallStats.completed}</p>
                <p className="text-sm text-gray-600">Finished tasks</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">In Progress</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{overallStats.inProgress}</p>
                <p className="text-sm text-gray-600">Active work</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Play className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delayed</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{overallStats.delayed}</p>
                <p className="text-sm text-gray-600">Need attention</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/50">
        <CardContent className="pt-4 pb-4 px-4 sm:px-6">
          <div className="flex flex-col gap-4">
            {/* Single Row Layout */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks, projects, assignees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-10 text-sm"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-3 sm:gap-4">
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="h-10 w-36 sm:w-40 bg-white dark:bg-gray-900 text-sm">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-32 sm:w-36 bg-white dark:bg-gray-900 text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Add Task Button */}
                <TaskFormModalOptimized onTaskCreated={() => {
                  fetchProjects()
                  refetchTasks()
                }} />
              </div>
            </div>
            
            {/* View Mode Buttons */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === "daily" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("daily")}
                className={`h-8 sm:h-10 text-sm px-3 sm:px-4 whitespace-nowrap flex-1 transition-all duration-200 ${
                  viewMode === "daily" 
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
                }`}
              >
                Daily
              </Button>
              <Button
                variant={viewMode === "weekly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("weekly")}
                className={`h-8 sm:h-10 text-sm px-3 sm:px-4 whitespace-nowrap flex-1 transition-all duration-200 ${
                  viewMode === "weekly" 
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
                }`}
              >
                Weekly
              </Button>
              <Button
                variant={viewMode === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("monthly")}
                className={`h-8 sm:h-10 text-sm px-3 sm:px-4 whitespace-nowrap flex-1 transition-all duration-200 ${
                  viewMode === "monthly" 
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
                }`}
              >
                Monthly
              </Button>
              <Button
                variant={viewMode === "full" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("full")}
                className={`h-8 sm:h-10 text-sm px-3 sm:px-4 whitespace-nowrap flex-1 transition-all duration-200 ${
                  viewMode === "full" 
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
                }`}
              >
                Full Timeline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Navigation */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3 min-w-0">
              <CardTitle className="dark:text-white text-sm sm:text-lg truncate">
                {projectFilter !== "all" 
                  ? `${projects.find(p => p.id === projectFilter)?.name || 'Unknown Project'} Timeline` 
                  : viewMode === "daily" 
                    ? `Daily - ${currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
                    : viewMode === "weekly"
                      ? `Weekly - ${currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
                      : viewMode === "monthly"
                        ? `Monthly - ${currentPeriod.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`
                        : "Full Timeline"
                }
              </CardTitle>
              <Badge variant="outline" className="text-xs w-fit">
                {filteredTasks.length} tasks
              </Badge>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {viewMode !== "full" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigatePeriod("prev")}
                    className="h-10 w-10 sm:h-12 sm:w-12 p-0"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = getCurrentPhilippinesTime()
                      setCurrentPeriod(today)
                      
                      // Scroll to today marker if it exists
                      setTimeout(() => {
                        const todayMarker = document.querySelector('[title*="Today"]')
                        if (todayMarker) {
                          todayMarker.scrollIntoView({ 
                            behavior: 'smooth', 
                            inline: 'center',
                            block: 'nearest'
                          })
                        }
                      }, 100)
                    }}
                    className="h-10 px-3 sm:h-12 sm:px-4 text-sm sm:text-base"
                    title="Go to current period (Philippines time)"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigatePeriod("next")}
                    className="h-10 w-10 sm:h-12 sm:w-12 p-0"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 sm:px-6">
          {/* Timeline Header - Desktop */}
          <div className="hidden sm:grid grid-cols-12 gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="col-span-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                Task Details
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollapsedTasks(new Set())}
                  className="text-xs px-2 py-1 h-auto"
                  title="Expand all tasks"
                >
                  Expand All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollapsedTasks(new Set(filteredTasks.map(t => t.id)))}
                  className="text-xs px-2 py-1 h-auto"
                  title="Collapse all tasks"
                >
                  Collapse All
                </Button>
              </div>
            </div>
            <div className="col-span-8">
              <div className="overflow-x-auto" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #e2e8f0'
              }}>
                <div className="min-w-full" style={{ minWidth: `${Math.max(800, timelineMonths.length * 60)}px` }}>
                  {viewMode === "daily" ? (
                    <>
                      <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Daily View - Philippines Time
                      </div>
                      {/* Year header for daily view */}
                      <div className="flex mb-1" style={{ width: '100%' }}>
                        {timelineMonths.reduce((acc: React.ReactElement[], day, index) => {
                          const showYear = index === 0 || day.year !== timelineMonths[index - 1].year;
                          if (showYear) {
                            const yearSpan = timelineMonths.filter(d => d.year === day.year).length;
                            const yearWidth = (yearSpan / timelineMonths.length) * 100;
                            acc.push(
                              <div 
                                key={`year-${day.year}`} 
                                className="text-xs text-center text-gray-700 dark:text-gray-300 font-bold border-r-2 border-gray-500 dark:border-gray-400 py-1"
                                style={{ width: `${yearWidth}%` }}
                              >
                                {day.year}
                              </div>
                            );
                          }
                          return acc;
                        }, [])}
                      </div>
                      {/* Month header for daily view */}
                      <div className="flex mb-1" style={{ width: '100%' }}>
                        {timelineMonths.reduce((acc: React.ReactElement[], day, index) => {
                          const showMonth = index === 0 || day.date.getMonth() !== timelineMonths[index - 1].date.getMonth();
                          if (showMonth) {
                            const monthSpan = timelineMonths.filter(d => 
                              d.date.getMonth() === day.date.getMonth() && d.year === day.year
                            ).length;
                            const monthWidth = (monthSpan / timelineMonths.length) * 100;
                            acc.push(
                              <div 
                                key={`month-${day.date.getMonth()}-${day.year}`} 
                                className="text-xs text-center text-gray-600 dark:text-gray-400 font-semibold border-r border-gray-400 dark:border-gray-500 py-1"
                                style={{ width: `${monthWidth}%` }}
                              >
                                {day.date.toLocaleDateString("en-US", { month: "short" })}
                              </div>
                            );
                          }
                          return acc;
                        }, [])}
                      </div>
                      {/* Day headers */}
                      <div className="flex pb-2" style={{ width: '100%' }}>
                        {timelineMonths.map((day, index) => {
                          const today = getCurrentPhilippinesTime()
                          const isToday = day.date.getTime() === today.getTime()
                          
                          return (
                            <div 
                              key={`${day.label}-${index}`} 
                              className={`flex-shrink-0 text-xs text-center font-medium px-1 py-1 border-r border-gray-300 dark:border-gray-600 last:border-r-0 ${
                                isToday 
                                  ? 'bg-blue-100 text-blue-800 font-bold border-2 border-blue-500 rounded' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                              style={{ width: `${100 / timelineMonths.length}%`, minWidth: '40px' }}
                            >
                              <div className="truncate">{day.date.getDate()}</div>
                              {isToday && <div className="text-[10px] text-blue-600">TODAY</div>}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : viewMode === "weekly" ? (
                    <>
                      <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Weekly View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric", month: "long" })}
                      </div>
                      {/* Year header for weekly view */}
                      <div className="flex mb-1" style={{ width: '100%' }}>
                        {timelineMonths.reduce((acc: React.ReactElement[], week, index) => {
                          const showYear = index === 0 || week.year !== timelineMonths[index - 1].year;
                          if (showYear) {
                            const yearSpan = timelineMonths.filter(w => w.year === week.year).length;
                            const yearWidth = (yearSpan / timelineMonths.length) * 100;
                            acc.push(
                              <div 
                                key={`year-${week.year}`} 
                                className="text-xs text-center text-gray-700 dark:text-gray-300 font-bold border-r-2 border-gray-500 dark:border-gray-400 py-1"
                                style={{ width: `${yearWidth}%` }}
                              >
                                {week.year}
                              </div>
                            );
                          }
                          return acc;
                        }, [])}
                      </div>
                      {/* Month header for weekly view */}
                      <div className="flex mb-1" style={{ width: '100%' }}>
                        {timelineMonths.reduce((acc: React.ReactElement[], week, index) => {
                          const showMonth = index === 0 || week.date.getMonth() !== timelineMonths[index - 1].date.getMonth();
                          if (showMonth) {
                            const monthSpan = timelineMonths.filter(w => 
                              w.date.getMonth() === week.date.getMonth() && w.year === week.year
                            ).length;
                            const monthWidth = (monthSpan / timelineMonths.length) * 100;
                            acc.push(
                              <div 
                                key={`month-${week.date.getMonth()}-${week.year}`} 
                                className="text-xs text-center text-gray-600 dark:text-gray-400 font-semibold border-r border-gray-400 dark:border-gray-500 py-1"
                                style={{ width: `${monthWidth}%` }}
                              >
                                {week.date.toLocaleDateString("en-US", { month: "short" })}
                              </div>
                            );
                          }
                          return acc;
                        }, [])}
                      </div>
                      {/* Week headers with week numbers */}
                      <div className="flex pb-2" style={{ width: '100%' }}>
                        {timelineMonths.map((week, index) => {
                          // Extract week number from label
                          const weekMatch = week.label.match(/Week (\d+)/)
                          const weekNumber = weekMatch ? parseInt(weekMatch[1]) : index + 1
                          
                          return (
                            <div 
                              key={`${week.label}-${index}`} 
                              className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-2 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0 bg-gray-50 dark:bg-gray-800 rounded-sm"
                              style={{ width: `${100 / timelineMonths.length}%`, minWidth: '80px' }}
                            >
                              <div className="whitespace-nowrap overflow-hidden text-ellipsis">Week {weekNumber}</div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : viewMode === "monthly" ? (
                    <>
                      <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Monthly View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric" })}
                      </div>
                      {/* Year header for monthly view */}
                      <div className="flex mb-1" style={{ width: '100%' }}>
                        {timelineMonths.reduce((acc: React.ReactElement[], month, index) => {
                          const showYear = index === 0 || month.year !== timelineMonths[index - 1].year;
                          if (showYear) {
                            const yearSpan = timelineMonths.filter(m => m.year === month.year).length;
                            const yearWidth = (yearSpan / timelineMonths.length) * 100;
                            acc.push(
                              <div 
                                key={`year-${month.year}`} 
                                className="text-xs text-center text-gray-700 dark:text-gray-300 font-bold border-r-2 border-gray-500 dark:border-gray-400 py-1"
                                style={{ width: `${yearWidth}%` }}
                              >
                                {month.year}
                              </div>
                            );
                          }
                          return acc;
                        }, [])}
                      </div>
                      {/* Month headers */}
                      <div className="flex pb-2" style={{ width: '100%' }}>
                        {timelineMonths.map((month, index) => (
                          <div 
                            key={`${month.label}-${index}`} 
                            className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 py-1 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                            style={{ width: `${100 / timelineMonths.length}%`, minWidth: '80px' }}
                          >
                            <div className="truncate">{month.label}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Full Timeline View
                        <span className="text-xs font-normal text-gray-500 ml-2">
                          ({timelineMonths.length > 0 ? `${timelineMonths[0].year} - ${timelineMonths[timelineMonths.length - 1].year}` : ''})
                        </span>
                      </div>

                      {timelineMonths.length > 0 && (
                        <div className="pb-2" style={{ width: '100%' }}>
                          {/* Year headers */}
                          <div className="flex mb-1">
                            {timelineMonths.reduce((acc: React.ReactElement[], month, index) => {
                              const showYear = index === 0 || month.year !== timelineMonths[index - 1].year;
                              if (showYear) {
                                const yearSpan = timelineMonths.filter(m => m.year === month.year).length;
                                const yearWidth = (yearSpan / timelineMonths.length) * 100;
                                acc.push(
                                  <div 
                                    key={`year-${month.year}`} 
                                    className="text-xs text-center text-gray-700 dark:text-gray-300 font-bold border-r-2 border-gray-500 dark:border-gray-400 py-1"
                                    style={{ width: `${yearWidth}%` }}
                                  >
                                    {month.year}
                                  </div>
                                );
                              }
                              return acc;
                            }, [])}
                          </div>
                          
                          {/* Month headers */}
                          <div className="flex mb-1">
                            {timelineMonths.map((month, index) => (
                              <div 
                                key={`${month.label}-${month.date.getFullYear()}-${index}`} 
                                className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 py-1 border-r border-gray-400 dark:border-gray-500 last:border-r-0"
                                style={{ width: `${100 / timelineMonths.length}%`, minWidth: '60px' }}
                              >
                                <div className="truncate" title={month.label}>{month.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-gray-400 dark:text-gray-500">
            <div className="col-span-4"></div>
            <div className="col-span-8">
              <div className="overflow-x-auto" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #e2e8f0'
              }}>
                <div className="min-w-full" style={{ minWidth: `${Math.max(800, timelineMonths.length * 60)}px` }}>
                  {viewMode === "daily" ? (
                    <div className="flex" style={{ width: '100%' }}>
                      {timelineMonths.map((day, index) => (
                        <div 
                          key={`grid-${day.label}-${index}`} 
                          className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30"
                          style={{ width: `${100 / timelineMonths.length}%` }}
                        ></div>
                      ))}
                    </div>
                  ) : viewMode === "weekly" ? (
                    <div className="flex" style={{ width: '100%' }}>
                      {timelineMonths.map((week, index) => (
                        <div 
                          key={`grid-${week.label}-${index}`} 
                          className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30"
                          style={{ width: `${100 / timelineMonths.length}%` }}
                        ></div>
                      ))}
                    </div>
                  ) : viewMode === "monthly" ? (
                    <div className="flex" style={{ width: '100%' }}>
                      {timelineMonths.map((month, index) => (
                        <div 
                          key={`grid-${month.label}-${index}`} 
                          className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30"
                          style={{ width: `${100 / timelineMonths.length}%` }}
                        ></div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex" style={{ width: '100%' }}>
                      {timelineMonths.map((_, index) => (
                        <div 
                          key={`grid-full-${index}`} 
                          className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30"
                          style={{ width: `${100 / timelineMonths.length}%` }}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Timeline Header */}
          <div className="sm:hidden mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {viewMode === "daily" 
                  ? currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                  : viewMode === "weekly"
                    ? `Week of ${currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
                    : viewMode === "monthly"
                      ? currentPeriod.toLocaleDateString("en-PH", { month: "long", year: "numeric" })
                      : "Timeline Overview"
                }
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              </div>
              
              {/* Mobile Timeline Scale */}
              <div className="w-full overflow-x-auto" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #f7fafc'
              }}>
                <div className="flex gap-1 pb-2 min-w-max">
                  {viewMode === "daily" ? (
                    timelineMonths.slice(0, 7).map((day, index) => {
                      const today = getCurrentPhilippinesTime()
                      const isToday = day.date.getTime() === today.getTime()
                      
                      return (
                        <div 
                          key={`mobile-${day.label}-${index}`} 
                          className={`flex-shrink-0 text-xs text-center font-medium px-2 py-1 border border-gray-300 dark:border-gray-600 rounded ${
                            isToday 
                              ? 'bg-blue-100 text-blue-800 font-bold border-blue-500' 
                              : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                          }`}
                          style={{ minWidth: '45px' }}
                        >
                          <div className="truncate">{day.label.split(' ')[1] || day.label}</div>
                        </div>
                      )
                    })
                  ) : viewMode === "weekly" ? (
                    timelineMonths.slice(0, 4).map((week, index) => (
                      <div 
                        key={`mobile-${week.label}-${index}`} 
                        className="flex-shrink-0 text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        style={{ minWidth: '60px' }}
                      >
                        <div className="truncate">{week.label.split(' ')[0]} W{week.label.split(' ')[2] || '1'}</div>
                      </div>
                    ))
                  ) : viewMode === "monthly" ? (
                    timelineMonths.slice(0, 6).map((month, index) => (
                      <div 
                        key={`mobile-${month.label}-${index}`} 
                        className="flex-shrink-0 text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        style={{ minWidth: '50px' }}
                      >
                        <div className="truncate">{month.label.split(' ')[0]}</div>
                      </div>
                    ))
                  ) : (
                    timelineMonths.slice(0, 8).map((month, index) => (
                      <div 
                        key={`mobile-${month.label}-${index}`} 
                        className="flex-shrink-0 text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        style={{ minWidth: '40px' }}
                      >
                        <div className="truncate">{month.label.split(' ')[0]}</div>
                      </div>
                    ))
                  )}
                  {timelineMonths.length > (viewMode === "daily" ? 7 : viewMode === "weekly" ? 4 : viewMode === "monthly" ? 6 : 8) && (
                    <div className="flex-shrink-0 text-xs text-center text-gray-500 dark:text-gray-400 px-2 py-1">
                      +{timelineMonths.length - (viewMode === "daily" ? 7 : viewMode === "weekly" ? 4 : viewMode === "monthly" ? 6 : 8)} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Task Rows */}
          <div className="space-y-3 sm:space-y-4">
            {filteredTasks.map((task, index) => {
              const position = getTaskPosition(task, timelineMonths)
              const daysUntilDeadline = getDaysUntilDeadline(task.end_date, task.status)
              const overdue = isOverdue(task.end_date, task.status)
              const isCollapsed = collapsedTasks.has(task.id)

              return (
                <div key={task.id}>
                  {/* Desktop Layout */}
                  <div
                    className={`hidden sm:grid grid-cols-12 gap-2 items-center py-2 px-3 rounded-lg transition-colors group relative ${
                      index % 2 === 0 
                        ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800' 
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {/* Task Info - Desktop */}
                    <div className="col-span-4 space-y-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTaskCollapse(task.id)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <div className="flex items-center gap-2">
                              {task.alphabetical_id && (
                                <Badge variant="outline" className="text-xs px-1 py-0 bg-gray-100 text-gray-700 border-gray-300">
                                  {task.alphabetical_id}
                                </Badge>
                              )}
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</h3>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate ml-8">{task.project_name}</p>
                          
                          {!isCollapsed && (
                            <div className="ml-8 mt-2 space-y-2">
                              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {formatDate(task.start_date)} - {formatDate(task.end_date)}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {task.assignee ? (
                                    <div className="flex flex-wrap gap-1">
                                      {(() => {
                                        const assignees = task.assignee.split(', ')
                                        const headcounts = task.assignee_headcounts || {}
                                        const displayAssignees = assignees.slice(0, 2)
                                        const remainingCount = assignees.length - 2
                                        
                                        return (
                                          <>
                                            {displayAssignees.map((assignee, index) => {
                                              const headcount = headcounts[assignee.trim()] || 1
                                              return (
                                                <Badge 
                                                  key={index} 
                                                  variant="outline" 
                                                  className="text-xs px-1 py-0 h-auto bg-blue-50 border-blue-200 text-blue-800"
                                                >
                                                  {assignee.trim()} ({headcount})
                                                </Badge>
                                              )
                                            })}
                                            {remainingCount > 0 && (
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs px-1 py-0 h-auto hover:bg-gray-100"
                                                  >
                                                    +{remainingCount} more
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                  {assignees.slice(2).map((assignee, index) => {
                                                    const headcount = headcounts[assignee.trim()] || 1
                                                    return (
                                                      <DropdownMenuItem key={index + 2} className="text-xs">
                                                        {assignee.trim()} ({headcount} people)
                                                      </DropdownMenuItem>
                                                    )
                                                  })}
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            )}
                                          </>
                                        )
                                      })()}
                                    </div>
                                  ) : (
                                    <span>Unassigned</span>
                                  )}
                                </div>
                                {/* Show completion timestamp if task is completed */}
                                {task.status === 'completed' && task.completed_at && (
                                  <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 mt-1">
                                    <span className="font-medium">✓ Completed:</span>{' '}
                                    {new Date(task.completed_at).toLocaleDateString("en-PH", {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      timeZone: 'Asia/Manila'
                                    })}
                                  </div>
                                )}
                                {daysUntilDeadline !== null && (
                                  <div className={`flex items-center ${overdue ? "text-red-600 dark:text-red-400" : ""}`}>
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>
                                      {overdue
                                        ? `${Math.abs(daysUntilDeadline)} days overdue`
                                        : `${daysUntilDeadline} days remaining`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <MoreVertical className="h-5 w-5" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleNotesTask(task)}>
                            <StickyNote className="h-5 w-5 mr-2" />
                            {task.notes ? 'View Notes' : 'Add Notes'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTaskReport(task)}>
                            <FileText className="h-5 w-5 mr-2" />
                            Export Task Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTask(task)}>
                            <Edit className="h-5 w-5 mr-2" />
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task)}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                          >
                            <Trash2 className="h-5 w-5 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Status Badge - Only show when not collapsed */}
                    {!isCollapsed && (
                      <div className="flex items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost" 
                              size="sm"
                              className={`h-auto p-1 ${getStatusColor(task.status, overdue)} hover:opacity-80 transition-opacity`}
                            >
                              <span className="flex items-center space-x-1">
                                {getStatusIcon(task.status, overdue)}
                                <span className="capitalize">
                                  {getEffectiveStatus(task.status, overdue)?.replace("-", " ") || 'Unknown'}
                                </span>
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  await updateTaskStatus({ taskId: task.id, status: 'planning' })
                                  toast.success('Task status updated to Planning')
                                } catch {
                                  toast.error('Failed to update task status')
                                }
                              }}
                            >
                              Planning
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  await updateTaskStatus({ taskId: task.id, status: 'in-progress' })
                                  toast.success('Task status updated to In Progress')
                                } catch {
                                  toast.error('Failed to update task status')
                                }
                              }}
                            >
                              In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  await updateTaskStatus({ taskId: task.id, status: 'on-hold' })
                                  toast.success('Task status updated to On Hold')
                                } catch {
                                  toast.error('Failed to update task status')
                                }
                              }}
                            >
                              On Hold
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  await updateTaskStatus({ taskId: task.id, status: 'completed' })
                                  toast.success('Task status updated to Completed')
                                } catch {
                                  toast.error('Failed to update task status')
                                }
                              }}
                            >
                              Completed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  {/* Timeline - Desktop */}
                  <div className="col-span-8">
                    <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      {position.isVisible && (
                        <div
                          className={`absolute top-1 bottom-1 rounded-md transition-all border ${getProjectBarColor(task.status, overdue)}`}
                          style={{
                            left: position.left,
                            width: position.width,
                          }}
                        >
                        </div>
                      )}

                          {/* Today marker - same implementation as before */}
                          {(() => {
                            const today = getCurrentPhilippinesTime()
                            
                            let todayPosition = 0
                            let isTodayVisible = false

                            if (viewMode === "weekly") {
                              for (let i = 0; i < timelineMonths.length; i++) {
                                const weekStart = new Date(timelineMonths[i].date)
                                weekStart.setHours(0, 0, 0, 0)
                                const weekEnd = new Date(timelineMonths[i].endDate)
                                weekEnd.setHours(23, 59, 59, 999)
                                
                                if (today >= weekStart && today <= weekEnd) {
                                  const weekColumnWidth = 100 / timelineMonths.length
                                  const weekStartPosition = i * weekColumnWidth
                                  const daysInWeek = 7
                                  const dayOfWeek = (today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
                                  const dayRatio = dayOfWeek / daysInWeek
                                  const positionWithinWeek = dayRatio * weekColumnWidth
                                  
                                  todayPosition = weekStartPosition + positionWithinWeek
                                  isTodayVisible = true
                                  break
                                }
                              }
                            } else if (viewMode === "monthly") {
                              for (let i = 0; i < timelineMonths.length; i++) {
                                const monthStart = new Date(timelineMonths[i].date)
                                monthStart.setHours(0, 0, 0, 0)
                                const monthEnd = new Date(timelineMonths[i].endDate)
                                monthEnd.setHours(23, 59, 59, 999)
                                
                                if (today >= monthStart && today <= monthEnd) {
                                  const monthColumnWidth = 100 / timelineMonths.length
                                  const monthStartPosition = i * monthColumnWidth
                                  
                                  const monthTotalDays = monthEnd.getDate()
                                  const todayDayOfMonth = today.getDate()
                                  const dayRatio = (todayDayOfMonth - 1) / (monthTotalDays - 1)
                                  const positionWithinMonth = dayRatio * monthColumnWidth
                                  
                                  todayPosition = monthStartPosition + positionWithinMonth
                                  isTodayVisible = true
                                  break
                                }
                              }
                            } else if (viewMode === "daily") {
                              for (let i = 0; i < timelineMonths.length; i++) {
                                const dayStart = new Date(timelineMonths[i].date)
                                dayStart.setHours(0, 0, 0, 0)
                                const dayEnd = new Date(timelineMonths[i].endDate)
                                dayEnd.setHours(23, 59, 59, 999)
                                
                                if (today >= dayStart && today <= dayEnd) {
                                  const dayColumnWidth = 100 / timelineMonths.length
                                  const dayStartPosition = i * dayColumnWidth
                                  todayPosition = dayStartPosition + (dayColumnWidth / 2)
                                  isTodayVisible = true
                                  break
                                }
                              }
                            } else {
                              const timelineStart = timelineMonths[0].date
                              const timelineEnd = timelineMonths[timelineMonths.length - 1].endDate ||
                                new Date(
                                  timelineMonths[timelineMonths.length - 1].date.getFullYear(),
                                  timelineMonths[timelineMonths.length - 1].date.getMonth() + 1,
                                  0,
                                )

                              const totalDuration = timelineEnd.getTime() - timelineStart.getTime()
                              const todayOffset = today.getTime() - timelineStart.getTime()
                              todayPosition = (todayOffset / totalDuration) * 100
                              isTodayVisible = todayPosition >= 0 && todayPosition <= 100
                            }

                            return isTodayVisible ? (
                              <div
                                className="absolute top-0 bottom-0 w-1 bg-red-600 z-30 rounded-sm shadow-sm"
                                style={{ left: `${todayPosition}%` }}
                                title={`Today - ${today.toLocaleDateString("en-PH", { 
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}`}
                              />
                            ) : null
                          })()}
                        </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className={`sm:hidden p-2 rounded-lg border-l-4 transition-colors ${
                    overdue ? 'border-l-red-500' : 
                    task.status === 'completed' ? 'border-l-green-500' :
                    task.status === 'in-progress' ? 'border-l-orange-500' : 'border-l-blue-500'
                  } ${
                    index % 2 === 0 
                      ? 'bg-white dark:bg-gray-900' 
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    {/* Task Header - Mobile */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTaskCollapse(task.id)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {task.alphabetical_id && (
                            <Badge variant="outline" className="text-xs px-1 py-0 bg-gray-100 text-gray-700 border-gray-300">
                              {task.alphabetical_id}
                            </Badge>
                          )}
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost" 
                              size="sm"
                              className={`h-auto p-1 text-xs px-1.5 py-0.5 ${getStatusColor(task.status, overdue)} hover:opacity-80 transition-opacity`}
                            >
                              {formatStatus(task.status, overdue)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  await updateTaskStatus({ taskId: task.id, status: 'planning' })
                                  toast.success('Task status updated to Planning')
                                } catch {
                                  toast.error('Failed to update task status')
                                }
                              }}
                            >
                              Planning
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  await updateTaskStatus({ taskId: task.id, status: 'in-progress' })
                                  toast.success('Task status updated to In Progress')
                                } catch {
                                  toast.error('Failed to update task status')
                                }
                              }}
                            >
                              In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  await updateTaskStatus({ taskId: task.id, status: 'on-hold' })
                                  toast.success('Task status updated to On Hold')
                                } catch {
                                  toast.error('Failed to update task status')
                                }
                              }}
                            >
                              On Hold
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  await updateTaskStatus({ taskId: task.id, status: 'completed' })
                                  toast.success('Task status updated to Completed')
                                } catch {
                                  toast.error('Failed to update task status')
                                }
                              }}
                            >
                              Completed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => handleNotesTask(task)} className="text-xs">
                            <StickyNote className="h-4 w-4 mr-2" />
                            {task.notes ? 'View Notes' : 'Add Notes'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTaskReport(task)} className="text-xs">
                            <FileText className="h-4 w-4 mr-2" />
                            Export Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTask(task)} className="text-xs">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task)}
                            className="text-red-600 dark:text-red-400 text-xs"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2 ml-8">
                      <span className="truncate">{task.project_name}</span>
                    </div>

                    {/* Timeline Bar - Mobile - Always Visible */}
                    <div className="mb-2">
                      <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                        {position.isVisible && (
                          <div
                            className={`absolute top-0 bottom-0 rounded-md ${getProjectBarColor(task.status, overdue)} opacity-80`}
                            style={{
                              left: position.left,
                              width: position.width,
                            }}
                          >
                            <div className="flex items-center justify-center h-full">
                              <span className="text-white text-xs font-medium px-1">
                                {task.progress ? `${task.progress}%` : ''}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Today line - Mobile */}
                        {(() => {
                          const today = getCurrentPhilippinesTime()
                          
                          let todayPosition = 0
                          let isTodayVisible = false

                          if (viewMode === "weekly") {
                            for (let i = 0; i < timelineMonths.length; i++) {
                              const weekStart = new Date(timelineMonths[i].date)
                              weekStart.setHours(0, 0, 0, 0)
                              const weekEnd = new Date(timelineMonths[i].endDate)
                              weekEnd.setHours(23, 59, 59, 999)
                              
                              if (today >= weekStart && today <= weekEnd) {
                                const weekColumnWidth = 100 / timelineMonths.length
                                const weekStartPosition = i * weekColumnWidth
                                const daysInWeek = 7
                                const dayOfWeek = (today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
                                const dayRatio = dayOfWeek / daysInWeek
                                const positionWithinWeek = dayRatio * weekColumnWidth
                                
                                todayPosition = weekStartPosition + positionWithinWeek
                                isTodayVisible = true
                                break
                              }
                            }
                          } else if (viewMode === "monthly") {
                            for (let i = 0; i < timelineMonths.length; i++) {
                              const monthStart = new Date(timelineMonths[i].date)
                              monthStart.setHours(0, 0, 0, 0)
                              const monthEnd = new Date(timelineMonths[i].endDate)
                              monthEnd.setHours(23, 59, 59, 999)
                              
                              if (today >= monthStart && today <= monthEnd) {
                                const monthColumnWidth = 100 / timelineMonths.length
                                const monthStartPosition = i * monthColumnWidth
                                const monthTotalDays = monthEnd.getDate()
                                const todayDayOfMonth = today.getDate()
                                const dayRatio = (todayDayOfMonth - 1) / (monthTotalDays - 1)
                                const positionWithinMonth = dayRatio * monthColumnWidth
                                
                                todayPosition = monthStartPosition + positionWithinMonth
                                isTodayVisible = true
                                break
                              }
                            }
                          } else if (viewMode === "daily") {
                            for (let i = 0; i < timelineMonths.length; i++) {
                              const dayStart = new Date(timelineMonths[i].date)
                              dayStart.setHours(0, 0, 0, 0)
                              const dayEnd = new Date(timelineMonths[i].endDate)
                              dayEnd.setHours(23, 59, 59, 999)
                              
                              if (today >= dayStart && today <= dayEnd) {
                                const dayColumnWidth = 100 / timelineMonths.length
                                const dayStartPosition = i * dayColumnWidth
                                todayPosition = dayStartPosition + (dayColumnWidth / 2)
                                isTodayVisible = true
                                break
                              }
                            }
                          } else {
                            const timelineStart = timelineMonths[0].date
                            const timelineEnd = timelineMonths[timelineMonths.length - 1].endDate ||
                              new Date(
                                timelineMonths[timelineMonths.length - 1].date.getFullYear(),
                                timelineMonths[timelineMonths.length - 1].date.getMonth() + 1,
                                0,
                              )

                            const totalDuration = timelineEnd.getTime() - timelineStart.getTime()
                            const todayOffset = today.getTime() - timelineStart.getTime()
                            todayPosition = (todayOffset / totalDuration) * 100
                            isTodayVisible = todayPosition >= 0 && todayPosition <= 100
                          }

                          return isTodayVisible ? (
                            <div
                              className="absolute top-0 bottom-0 w-1 bg-red-600 z-30 rounded-sm shadow-sm"
                              style={{ left: `${todayPosition}%` }}
                              title={`Today - ${today.toLocaleDateString("en-PH")}`}
                            />
                          ) : null
                        })()}
                      </div>
                    </div>

                    {/* Detailed Info - Mobile - Show when not collapsed */}
                    {!isCollapsed && (
                      <div className="ml-8 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.start_date)} - {formatDate(task.end_date)}
                            </span>
                            {task.assignee && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <div className="flex flex-wrap gap-1">
                                  {(() => {
                                    const assignees = task.assignee.split(', ')
                                    const headcounts = task.assignee_headcounts || {}
                                    const displayAssignees = assignees.slice(0, 2)
                                    const remainingCount = assignees.length - 2
                                    
                                    return (
                                      <>
                                        {displayAssignees.map((assignee, index) => {
                                          const headcount = headcounts[assignee.trim()] || 1
                                          return (
                                            <Badge 
                                              key={index} 
                                              variant="outline" 
                                              className="text-xs px-1 py-0 h-auto bg-blue-50 border-blue-200 text-blue-800"
                                            >
                                              {assignee.trim()} ({headcount})
                                            </Badge>
                                          )
                                        })}
                                        {remainingCount > 0 && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs px-1 py-0 h-auto hover:bg-gray-100"
                                              >
                                                +{remainingCount} more
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                              {assignees.slice(2).map((assignee, index) => {
                                                const headcount = headcounts[assignee.trim()] || 1
                                                return (
                                                  <DropdownMenuItem key={index + 2} className="text-xs">
                                                    {assignee.trim()} ({headcount} people)
                                                  </DropdownMenuItem>
                                                )
                                              })}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Completion Status for Mobile */}
                          <div className="flex items-center gap-2 text-xs">
                            {task.completed_at && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckSquare className="h-3 w-3" />
                                <span>Completed: {new Date(task.completed_at).toLocaleDateString("en-PH")}</span>
                              </div>
                            )}
                            {daysUntilDeadline !== null && (
                              <span className={`flex items-center gap-1 font-medium ${overdue ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                                <Clock className="h-3 w-3" />
                                {overdue
                                  ? `${Math.abs(daysUntilDeadline)}d overdue`
                                  : `${daysUntilDeadline}d left`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters to see task timelines</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Controls - Positioned at Bottom */}
      <StructuredExportControls
        onExport={handleStructuredExport}
        projects={projects || []}
        totalTasks={filteredTasks.length}
        isLoading={isExporting || projectsLoading || tasksLoading}
      />

      {/* Edit Task Modal */}
      <TaskEditModalOptimized
        task={editingTask ? {
          id: editingTask.id,
          title: editingTask.title,
          description: editingTask.description,
          project_id: editingTask.project_id,
          start_date: editingTask.start_date,
          end_date: editingTask.end_date,
          status: editingTask.status,
          priority: editingTask.priority,
          phase: editingTask.phase,
          category: editingTask.category,
          assignee: editingTask.assignee
        } : null}
        open={isEditModalOpen}
        onOpenChangeAction={setIsEditModalOpen}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Task Notes Modal */}
      <TaskNotesModal
        task={notesTask}
        open={isNotesModalOpen}
        onOpenChange={setIsNotesModalOpen}
        onNotesSubmit={handleNotesSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        itemName={deletingTask?.title}
        isLoading={isDeletingTask}
      />
    </div>
  )
}
