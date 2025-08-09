"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProjects } from "@/lib/hooks/useProjects"
import { useGanttTasks } from "@/lib/hooks/useGanttTasks"
import { TaskFormModalOptimized } from "./task-form-modal-optimized"
import { TaskEditModalOptimized } from "./task-edit-modal-optimized"
import { toast } from "react-hot-toast"
import {
  BarChart3,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Users,
  RefreshCw,
  Search,
  MoreVertical,
  Edit,
  Trash2,
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
  // Enhanced properties
  project_name?: string
  project_client?: string | null
  is_overdue?: boolean
  days_until_deadline?: number | null
  dependencyTasks?: EnhancedTask[]
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
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks, deleteTask } = useGanttTasks()
  
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [currentPeriod, setCurrentPeriod] = useState(new Date())
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "full">("weekly")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingTask, setEditingTask] = useState<EnhancedTask | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Set project filter when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      setProjectFilter(selectedProjectId)
    }
  }, [selectedProjectId])

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

  // Transform tasks data to include project information
  const enhancedTasks: EnhancedTask[] = useMemo(() => {
    return tasks.map(task => {
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
  }, [tasks, projects, isOverdue, getDaysUntilDeadline])

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

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
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

    if (viewMode === "full") {
      const { start, end } = getFullTimelineRange()
      const startDate = new Date(start.getFullYear(), start.getMonth(), 1)
      const endDate = new Date(end.getFullYear(), end.getMonth() + 1, 0)

      const currentDate = new Date(startDate)
      const totalMonths =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1

      // Dynamic granularity based on timeline length
      if (totalMonths > 24) {
        // For very long timelines (2+ years), show quarters only
        const startQuarter = Math.floor(startDate.getMonth() / 3)
        const startYear = startDate.getFullYear()
        const endQuarter = Math.floor(endDate.getMonth() / 3)
        const endYear = endDate.getFullYear()

        let currentYear = startYear
        let currentQuarter = startQuarter

        while (currentYear < endYear || (currentYear === endYear && currentQuarter <= endQuarter)) {
          const quarterStartMonth = currentQuarter * 3
          const quarterEndMonth = quarterStartMonth + 2
          const quarterStart = new Date(currentYear, quarterStartMonth, 1)
          const quarterEnd = new Date(currentYear, quarterEndMonth + 1, 0)

          months.push({
            label: `Q${currentQuarter + 1}`,
            date: new Date(quarterStart),
            endDate: new Date(quarterEnd),
            quarter: currentQuarter + 1,
            year: currentYear,
            isQuarter: true,
          })

          currentQuarter++
          if (currentQuarter > 3) {
            currentQuarter = 0
            currentYear++
          }
        }
      } else if (totalMonths > 12) {
        // For medium timelines (1-2 years), show bi-monthly
        while (currentDate <= endDate) {
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)
          const actualEndDate = monthEnd > endDate ? endDate : monthEnd

          months.push({
            label: `${currentDate.toLocaleDateString("en-US", { month: "short" })}-${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toLocaleDateString("en-US", { month: "short" })}`,
            date: new Date(currentDate),
            endDate: new Date(actualEndDate),
            quarter: Math.floor(currentDate.getMonth() / 3) + 1,
            year: currentDate.getFullYear(),
            isQuarter: false,
          })

          currentDate.setMonth(currentDate.getMonth() + 2)
        }
      } else {
        // For shorter timelines (≤1 year), show monthly
        while (currentDate <= endDate) {
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

          months.push({
            label: currentDate.toLocaleDateString("en-US", { month: "short" }),
            date: new Date(currentDate),
            endDate: new Date(monthEnd),
            quarter: Math.floor(currentDate.getMonth() / 3) + 1,
            year: currentDate.getFullYear(),
            isQuarter: false,
          })

          currentDate.setMonth(currentDate.getMonth() + 1)
        }
      }
    } else if (viewMode === "weekly") {
      // Weekly view - show 4 weeks around current period
      const startOfWeek = new Date(currentPeriod)
      // Go back 1 week from current period to center it
      startOfWeek.setDate(currentPeriod.getDate() - 7)
      // Find the Sunday of that week
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      
      for (let weekNum = 1; weekNum <= 4; weekNum++) {
        const weekStart = new Date(startOfWeek)
        weekStart.setDate(startOfWeek.getDate() + (weekNum - 1) * 7)
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        months.push({
          label: `Week ${weekNum}`,
          date: new Date(weekStart),
          endDate: new Date(weekEnd),
          quarter: 1,
          year: weekStart.getFullYear(),
          isQuarter: false,
        })
      }
    } else if (viewMode === "daily") {
      // Daily view - show 14 days (2 weeks) around current period
      const startDate = new Date(currentPeriod)
      startDate.setDate(startDate.getDate() - 7) // 1 week before current date
      startDate.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < 14; i++) { // Show 14 days
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
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
    const matchesProject = projectFilter === "all" || task.project_id === projectFilter
    const matchesSearch =
      searchTerm === "" ||
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project_client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesPriority && matchesProject && matchesSearch
  })

  const timelineMonths = getTimelineMonths()

  const navigatePeriod = (direction: "prev" | "next") => {
    const newPeriod = new Date(currentPeriod)
    
    if (viewMode === "daily") {
      newPeriod.setDate(newPeriod.getDate() + (direction === "next" ? 1 : -1))
    } else if (viewMode === "weekly") {
      // Navigate by 4 weeks (28 days) to show the next/previous set of 4 weeks
      newPeriod.setDate(newPeriod.getDate() + (direction === "next" ? 28 : -28))
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

  const handleDeleteTask = async (task: EnhancedTask) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await deleteTask(task.id)
        toast.success("Task deleted successfully!")
      } catch (error) {
        console.error("Error deleting task:", error)
        toast.error("Failed to delete task. Please try again.")
      }
    }
  }

  const handleTaskUpdated = () => {
    refetchTasks()
    setEditingTask(null)
    setIsEditModalOpen(false)
  }

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
    <div className="p-2 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4 overflow-y-auto h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Task Gantt Chart</h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
            Task timelines, deadlines, and progress tracking
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <TaskFormModalOptimized onTaskCreated={() => {
            fetchProjects(true)
            refetchTasks()
          }} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-blue-500 dark:bg-gray-900 dark:border-gray-800 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.total}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">In timeline</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 dark:bg-gray-900 dark:border-gray-800 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.completed}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Finished tasks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 dark:bg-gray-900 dark:border-gray-800 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">In Progress</CardTitle>
            <Play className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.inProgress}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active work</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 dark:bg-gray-900 dark:border-gray-800 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Delayed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.delayed}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 dark:bg-gray-900 dark:border-gray-800 hover:shadow-md transition-all duration-200 col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.avgProgress}%</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overall completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-3 pb-3 px-3 sm:px-6">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks, projects, assignees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-9 sm:h-10 text-sm"
              />
            </div>
            
            {/* Filters Row */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2 lg:gap-3">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-9 sm:h-9 lg:h-10 bg-white dark:bg-gray-900 text-xs sm:text-sm lg:text-sm">
                  <SelectValue placeholder="Projects" />
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
                <SelectTrigger className="h-9 sm:h-9 lg:h-10 bg-white dark:bg-gray-900 text-xs sm:text-sm lg:text-sm">
                  <SelectValue placeholder="Status" />
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

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9 sm:h-9 lg:h-10 bg-white dark:bg-gray-900 text-xs sm:text-sm lg:text-sm">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View Mode Buttons */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === "daily" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("daily")}
                className={`h-7 sm:h-8 text-xs px-2 sm:px-3 whitespace-nowrap flex-1 transition-all duration-200 ${
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
                className={`h-7 sm:h-8 text-xs px-2 sm:px-3 whitespace-nowrap flex-1 transition-all duration-200 ${
                  viewMode === "weekly" 
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
                }`}
              >
                Weekly
              </Button>
              <Button
                variant={viewMode === "full" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("full")}
                className={`h-7 sm:h-8 text-xs px-2 sm:px-3 whitespace-nowrap flex-1 transition-all duration-200 ${
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
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Get current date in Philippines timezone properly
                      const now = new Date()
                      const philippinesOffset = 8 * 60 // Philippines is UTC+8
                      const localOffset = now.getTimezoneOffset()
                      const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
                      setCurrentPeriod(philippinesTime)
                    }}
                    className="h-8 px-2 sm:h-10 sm:px-3 text-xs sm:text-sm"
                    title="Go to current period (Philippines time)"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigatePeriod("next")}
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 sm:px-6">
          {/* Timeline Header - Desktop */}
          <div className="hidden sm:grid grid-cols-12 gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="col-span-4 text-sm font-medium text-gray-600 dark:text-gray-400">Task Details</div>
            <div className="col-span-8">
              {viewMode === "daily" ? (
                <>
                  <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Daily View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric", month: "long" })}
                  </div>
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-14 gap-1 min-w-max" style={{ minWidth: '800px' }}>
                      {timelineMonths.map((day, index) => (
                        <div key={day.label + index} className={`text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 ${
                          index < timelineMonths.length - 1 ? 'border-r border-gray-400 dark:border-gray-500' : ''
                        }`} style={{ minWidth: '55px' }}>
                          <div className="truncate">{day.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : viewMode === "weekly" ? (
                <>
                  <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Weekly View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric", month: "long" })}
                  </div>
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-4 gap-1 min-w-max" style={{ minWidth: '600px' }}>
                      {timelineMonths.map((week, index) => (
                        <div key={week.label + index} className={`text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 ${
                          index < timelineMonths.length - 1 ? 'border-r border-gray-400 dark:border-gray-500' : ''
                        }`} style={{ minWidth: '140px' }}>
                          <div className="truncate">{week.label}</div>
                        </div>
                      ))}
                    </div>
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
                    <div className="overflow-x-auto">
                      {/* Year headers */}
                      <div 
                        className="grid gap-1 mb-1 min-w-max" 
                        style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, minmax(60px, 1fr))`, minWidth: `${timelineMonths.length * 60}px` }}
                      >
                        {timelineMonths.reduce((acc: React.ReactElement[], month, index) => {
                          // Show year only at the start of each new year or first month
                          const showYear = index === 0 || month.year !== timelineMonths[index - 1].year;
                          if (showYear) {
                            const yearSpan = timelineMonths.filter(m => m.year === month.year).length;
                            acc.push(
                              <div 
                                key={`year-${month.year}`} 
                                className="text-xs text-center text-gray-700 dark:text-gray-300 font-bold border-r-2 border-gray-500 dark:border-gray-400 py-1"
                                style={{ gridColumn: `span ${yearSpan}` }}
                              >
                                {month.year}
                              </div>
                            );
                          }
                          return acc;
                        }, [])}
                      </div>
                      
                      {/* Month/Quarter headers */}
                      <div 
                        className="grid gap-1 mb-1 min-w-max" 
                        style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, minmax(60px, 1fr))`, minWidth: `${timelineMonths.length * 60}px` }}
                      >
                        {timelineMonths.map((month, index) => (
                          <div 
                            key={month.label + month.date.getFullYear()} 
                            className={`text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 py-1 ${
                              index < timelineMonths.length - 1 ? 'border-r border-gray-400 dark:border-gray-500' : ''
                            }`}
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

          <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-gray-400 dark:text-gray-500">
            <div className="col-span-4"></div>
            <div className="col-span-8">
              {viewMode === "daily" ? (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-14 gap-1 min-w-max" style={{ minWidth: '800px' }}>
                    {timelineMonths.map((day, index) => (
                      <div key={day.label + index} className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30" style={{ minWidth: '55px' }}></div>
                    ))}
                  </div>
                </div>
              ) : viewMode === "weekly" ? (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-4 gap-1 min-w-max" style={{ minWidth: '600px' }}>
                    {timelineMonths.map((week, index) => (
                      <div key={week.label + index} className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30" style={{ minWidth: '140px' }}></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div 
                    className="grid gap-1 min-w-max"
                    style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, minmax(60px, 1fr))`, minWidth: `${timelineMonths.length * 60}px` }}
                  >
                    {timelineMonths.map((_, index) => (
                      <div key={index} className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30"></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Timeline Header */}
          <div className="sm:hidden mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {viewMode === "daily" 
                  ? currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                  : viewMode === "weekly"
                    ? `Week of ${currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
                    : "Timeline Overview"
                }
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Task Rows */}
          <div className="space-y-2 sm:space-y-4">
            {filteredTasks.map((task, index) => {
              const position = getTaskPosition(task, timelineMonths)
              const daysUntilDeadline = getDaysUntilDeadline(task.end_date, task.status)
              const overdue = isOverdue(task.end_date, task.status)

              return (
                <div key={task.id}>
                  {/* Desktop Layout */}
                  <div
                    className={`hidden sm:grid grid-cols-12 gap-2 items-center py-3 px-3 rounded-lg transition-colors group relative ${
                      index % 2 === 0 
                        ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800' 
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {/* Task Info - Desktop */}
                    <div className="col-span-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{task.project_name}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEditTask(task)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task)}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(task.status, overdue)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(task.status, overdue)}
                          <span className="capitalize">
                            {getEffectiveStatus(task.status, overdue)?.replace("-", " ") || 'Unknown'}
                          </span>
                        </span>
                      </Badge>
                      <Badge className={getPriorityColor(task.priority || 'medium')}>
                        {task.priority || 'medium'}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {formatDate(task.start_date)} - {formatDate(task.end_date)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{task.assignee || 'Unassigned'}</span>
                      </div>
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

                  {/* Timeline - Desktop */}
                  <div className="col-span-8">
                    <div className="overflow-x-auto">
                      <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" 
                           style={{ 
                             minWidth: viewMode === "daily" ? '800px' : 
                                      viewMode === "weekly" ? '600px' : 
                                      `${timelineMonths.length * 60}px` 
                           }}>
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

                        {/* Today line */}
                        {(() => {
                          // Get current date in Philippines timezone properly
                          const now = new Date()
                          const philippinesOffset = 8 * 60 // Philippines is UTC+8
                          const localOffset = now.getTimezoneOffset()
                          const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
                          
                          // Set to start of day to match how task dates are stored
                          const today = new Date(philippinesTime.getFullYear(), philippinesTime.getMonth(), philippinesTime.getDate())
                          
                          let todayPosition = 0
                          let isTodayVisible = false

                          if (viewMode === "weekly") {
                            // For weekly view, find which week contains today
                            for (let i = 0; i < timelineMonths.length; i++) {
                              const weekStart = new Date(timelineMonths[i].date)
                              weekStart.setHours(0, 0, 0, 0) // Start of day
                              const weekEnd = new Date(timelineMonths[i].endDate)
                              weekEnd.setHours(23, 59, 59, 999) // End of day
                              
                              // Check if today falls within this week
                              if (today >= weekStart && today <= weekEnd) {
                                // Today is in this week, position it in the center of the week column
                                const weekColumnWidth = 100 / timelineMonths.length // Each week takes up equal width
                                const weekStartPosition = i * weekColumnWidth
                                const weekCenterPosition = weekStartPosition + (weekColumnWidth / 2)
                                
                                todayPosition = weekCenterPosition
                                isTodayVisible = true
                                break
                              }
                            }
                          } else {
                            // For daily and full timeline views, use the original logic
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
                              className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-30"
                              style={{ left: `${todayPosition}%` }}
                              title={`Today - ${today.toLocaleDateString("en-PH")}`}
                            />
                          ) : null
                        })()}
                      </div>
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
                    {/* Task Header - Mobile - More Compact */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</h3>
                          <Badge className={`${getStatusColor(task.status, overdue)} text-xs px-1.5 py-0.5`}>
                            {getEffectiveStatus(task.status, overdue)?.replace("-", " ") || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="truncate">{task.project_name}</span>
                          <Badge className={`${getPriorityColor(task.priority || 'medium')} text-xs px-1.5 py-0.5`}>
                            {task.priority || 'medium'}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => handleEditTask(task)} className="text-xs">
                            <Edit className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task)}
                            className="text-red-600 dark:text-red-400 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Timeline Bar - Mobile - More Prominent */}
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
                          const now = new Date()
                          const philippinesOffset = 8 * 60
                          const localOffset = now.getTimezoneOffset()
                          const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
                          const today = new Date(philippinesTime.getFullYear(), philippinesTime.getMonth(), philippinesTime.getDate())
                          
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
                                const weekCenterPosition = weekStartPosition + (weekColumnWidth / 2)
                                
                                todayPosition = weekCenterPosition
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
                              className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-30"
                              style={{ left: `${todayPosition}%` }}
                            />
                          ) : null
                        })()}
                      </div>
                    </div>

                    {/* Compact Info Row */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.start_date)} - {formatDate(task.end_date)}
                        </span>
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {task.assignee}
                          </span>
                        )}
                      </div>
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
    </div>
  )
}
