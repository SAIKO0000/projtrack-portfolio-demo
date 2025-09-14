"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, AlertTriangle, BarChart3 } from "lucide-react"
import { useProjects } from "@/lib/hooks/useProjects"
import { useGanttTasks } from "@/lib/hooks/useGanttTasks"
import { useStructuredExport } from "@/lib/hooks/useStructuredExport"
import { TaskEditModalOptimized } from "./TaskEditModal"
import { StructuredExportControls } from "../structured-export-controls"
import { DeleteConfirmationDialog } from "../delete-confirmation-dialog"
import { toast } from "react-hot-toast"

// Import our modular components
import { GanttChartProps, EnhancedTask, ViewMode, OverallStats } from "./types"
import { isOverdue, getDaysUntilDeadline, getEffectiveStatus } from "./utils"
import { getTimelineMonths, navigatePeriod } from "./timeline-utils"
import { GanttStatsCards } from "./GanttStatsCards"
import { GanttFilters } from "./GanttFilters"
import { UnifiedGanttChart } from "./UnifiedGanttChart"
import { GanttHeader } from "./GanttHeader"

export function GanttChartEnhancedRefactored({ selectedProjectId }: GanttChartProps) {
  const { projects, loading: projectsLoading, error: projectsError, fetchProjects } = useProjects()
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks, deleteTask, updateTaskStatus, updateTask } = useGanttTasks()
  
  // Transform tasks for export compatibility
  const transformedTasks = useMemo(() => {
    return (tasks || []).map(task => {
      const t = task as Record<string, unknown>; // Type casting to access properties
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
        days_until_deadline: typeof t.days_until_deadline === 'number' ? t.days_until_deadline : undefined
      }
    })
  }, [tasks])

  const { exportStructuredReport, isExporting } = useStructuredExport({
    projects: projects || [],
    tasks: transformedTasks
  })
  
  // State
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [currentPeriod, setCurrentPeriod] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("weekly")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingTask, setEditingTask] = useState<EnhancedTask | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    task: EnhancedTask | null
    isDeleting: boolean
  }>({ open: false, task: null, isDeleting: false })
  
  // Set project filter when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      setProjectFilter(selectedProjectId)
    }
  }, [selectedProjectId])

  // Listen for navigate-to-today events
  useEffect(() => {
    const handleNavigateToToday = (event: CustomEvent) => {
      setCurrentPeriod(event.detail)
    }

    window.addEventListener('navigate-to-today', handleNavigateToToday as EventListener)
    
    return () => {
      window.removeEventListener('navigate-to-today', handleNavigateToToday as EventListener)
    }
  }, [])

  // Generate alphabetical task keys per project
  const generateTaskKey = useCallback((tasks: EnhancedTask[], projectId: string) => {
    // Get tasks for this project, sorted by creation time
    const projectTasks = tasks
      .filter(task => task.project_id === projectId)
      .sort((a, b) => {
        const dateA = new Date(a.created_at || '').getTime()
        const dateB = new Date(b.created_at || '').getTime()
        return dateA - dateB
      })

    // Generate alphabetical keys (A, B, C, ..., Z, AA, AB, ...)
    const generateAlphaKey = (index: number): string => {
      let result = ''
      let temp = index
      do {
        result = String.fromCharCode(65 + (temp % 26)) + result
        temp = Math.floor(temp / 26) - 1
      } while (temp >= 0)
      return result
    }

    // Return a map of task ID to task key
    const taskKeyMap: Record<string, string> = {}
    projectTasks.forEach((task, index) => {
      taskKeyMap[task.id] = generateAlphaKey(index)
    })
    
    return taskKeyMap
  }, [])

  // Transform tasks data to include project information and task keys
  const enhancedTasks: EnhancedTask[] = useMemo(() => {
    const transformed = tasks.map(task => {
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

    // Generate task keys for each project
    const projectIds = [...new Set(transformed.map(task => task.project_id).filter(Boolean))]
    const allTaskKeys: Record<string, string> = {}
    
    projectIds.forEach(projectId => {
      if (projectId) {
        const projectTaskKeys = generateTaskKey(transformed, projectId)
        Object.assign(allTaskKeys, projectTaskKeys)
      }
    })

    // Add task keys to the transformed tasks
    return transformed.map(task => ({
      ...task,
      task_key: allTaskKeys[task.id] || null
    }))
  }, [tasks, projects, generateTaskKey])

  // Filter tasks
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

  // Get timeline months
  const timelineMonths = getTimelineMonths(viewMode, currentPeriod, enhancedTasks)

  // Calculate stats for OverallStats format
  const overallStats: OverallStats = useMemo(() => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter((t) => t.status === "completed").length
    const inProgress = filteredTasks.filter((t) => t.status === "in-progress").length
    const delayed = filteredTasks.filter((t) => {
      const taskIsOverdue = isOverdue(t.end_date, t.status)
      return getEffectiveStatus(t.status, taskIsOverdue) === "delayed"
    }).length

    return { total, completed, inProgress, delayed }
  }, [filteredTasks])

  // Event handlers
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const handleStatusUpdate = useCallback(async (taskId: string, status: string) => {
    try {
      // Get current date in Philippines timezone
      const now = new Date()
      const philippinesOffset = 8 * 60 // Philippines is UTC+8
      const localOffset = now.getTimezoneOffset()
      const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
      
      await updateTaskStatus(taskId, status)
      // Optimistic update is handled in the hook, no need to refetch
      
      if (status === 'completed') {
        const completedTime = philippinesTime.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })
        toast.success(`Task completed at: ${completedTime}`)
      } else {
        toast.success(`Task status updated to ${status}`)
      }
    } catch (error) {
      console.error("Failed to update task status:", error)
      toast.error("Failed to update task status. Please try again.")
    }
  }, [updateTaskStatus])

  const handleNotesUpdate = useCallback(async (taskId: string, notes: string) => {
    try {
      await updateTask(taskId, { notes })
      // Optimistic update is handled in the hook, no need to refetch
      toast.success("Task notes updated successfully!")
    } catch (error) {
      console.error("Failed to update task notes:", error)
      toast.error("Failed to update task notes. Please try again.")
    }
  }, [updateTask])

  const handleNavigatePeriod = useCallback((direction: "prev" | "next") => {
    setCurrentPeriod(navigatePeriod(direction, viewMode, currentPeriod))
  }, [viewMode, currentPeriod])

  const handleEditTask = useCallback((task: EnhancedTask) => {
    setEditingTask(task)
    setIsEditModalOpen(true)
  }, [])

  const handleDeleteTask = useCallback(async (task: EnhancedTask) => {
    setDeleteDialog({ open: true, task, isDeleting: false })
  }, [])

  const confirmDeleteTask = useCallback(async () => {
    const { task } = deleteDialog
    if (!task) return

    setDeleteDialog(prev => ({ ...prev, isDeleting: true }))
    
    try {
      await deleteTask(task.id)
      toast.success("Task deleted successfully!")
      setDeleteDialog({ open: false, task: null, isDeleting: false })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task. Please try again.")
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }))
    }
  }, [deleteTask, deleteDialog])

  const handleTaskUpdated = useCallback(() => {
    refetchTasks()
    setEditingTask(null)
    setIsEditModalOpen(false)
  }, [refetchTasks])

  const handleTaskCreated = useCallback(() => {
    fetchProjects()
    refetchTasks()
  }, [fetchProjects, refetchTasks])

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

  // Loading state
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

  // Error state
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
    <div className="p-2 sm:p-4 md:p-6 space-y-1 sm:space-y-2 md:space-y-3 overflow-y-auto h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <GanttHeader />

      {/* Stats Cards */}
      <GanttStatsCards stats={overallStats} />

      {/* Filters */}
      <GanttFilters
        searchTerm={searchTerm}
        setSearchTermAction={setSearchTerm}
        projectFilter={projectFilter}
        setProjectFilterAction={setProjectFilter}
        statusFilter={statusFilter}
        setStatusFilterAction={setStatusFilter}
        viewMode={viewMode}
        setViewModeAction={setViewMode}
        projects={projects}
        onTaskCreatedAction={handleTaskCreated}
      />

      {/* Unified Gantt Chart */}
      <UnifiedGanttChart
        tasks={filteredTasks}
        viewMode={viewMode}
        currentPeriod={currentPeriod}
        projectFilter={projectFilter}
        projects={projects}
        timelineMonths={timelineMonths}
        onNavigatePeriodAction={handleNavigatePeriod}
        onTaskCreatedAction={handleTaskCreated}
        onEditTaskAction={handleEditTask}
        onDeleteTaskAction={handleDeleteTask}
        onStatusUpdateAction={handleStatusUpdate}
        onNotesSubmit={handleNotesUpdate}
        isExpanded={isExpanded}
        onToggleExpandAction={handleToggleExpand}
      />

      {filteredTasks.length === 0 && (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-3 px-3 sm:px-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters to see task timelines</p>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, task: null, isDeleting: false })}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone and will permanently remove all task data."
        itemName={deleteDialog.task?.title}
        isLoading={deleteDialog.isDeleting}
      />
    </div>
  )
}
