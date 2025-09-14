"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, Clock, MoreVertical, Edit, Trash2, CheckCircle, Play, Pause, AlertTriangle, ChevronDown, ChevronUp, StickyNote, ChevronLeft, ChevronRight } from "lucide-react"
import { EnhancedTask, TimelineMonth, ViewMode } from "./types"
import { getStatusColor, getStatusIconType, formatDate, getTaskPosition, getProjectBarColor } from "./utils"
import { TaskFormModal } from "./TaskFormModal"
import { TaskNotesModal } from "./TaskNotesModal"

interface Project {
  id: string
  name: string
}

interface UnifiedGanttChartProps {
  tasks: EnhancedTask[]
  viewMode: ViewMode
  currentPeriod: Date
  projectFilter: string
  projects: Project[]
  timelineMonths: TimelineMonth[]
  onNavigatePeriodAction: (direction: "prev" | "next") => void
  onTaskCreatedAction: () => void
  onEditTaskAction: (task: EnhancedTask) => void
  onDeleteTaskAction: (task: EnhancedTask) => void
  onStatusUpdateAction?: (taskId: string, status: string) => void
  onNotesSubmit?: (taskId: string, notes: string) => Promise<void>
  isExpanded?: boolean
  onToggleExpandAction?: () => void
}

const StatusIcon = ({ iconType, overdue }: { iconType: string, overdue: boolean }) => {
  const iconClass = "h-4 w-4"
  const color = overdue 
    ? "text-red-500" 
    : iconType === "completed" 
      ? "text-green-500"
      : iconType === "in-progress"
        ? "text-orange-500"
        : iconType === "planning"
          ? "text-blue-500"
          : iconType === "on-hold"
            ? "text-yellow-500"
            : iconType === "delayed"
              ? "text-red-500"
              : "text-gray-500"

  switch (iconType) {
    case "completed":
      return <CheckCircle className={`${iconClass} ${color}`} />
    case "in-progress":
      return <Play className={`${iconClass} ${color}`} />
    case "planning":
      return <Clock className={`${iconClass} ${color}`} />
    case "on-hold":
      return <Pause className={`${iconClass} ${color}`} />
    case "delayed":
      return <AlertTriangle className={`${iconClass} ${color}`} />
    default:
      return <Clock className={`${iconClass} ${color}`} />
  }
}

const formatCompletedDate = (completedAt: string | null) => {
  if (!completedAt) return null
  
  const date = new Date(completedAt)
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short", 
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  })
}

const capitalizeStatus = (status: string | null) => {
  if (!status) return 'Not Started'
  
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getAssigneeDisplay = (assignee: string | null, headcounts: Record<string, number> | null, maxVisible: number = 2) => {
  if (!assignee) return { visible: [], hidden: 0, total: 0 }
  
  const assignees = assignee.split(', ').map(a => a.trim()).filter(Boolean)
  const visible = assignees.slice(0, maxVisible).map(role => ({
    name: role,
    count: headcounts?.[role] || 1
  }))
  const hidden = Math.max(0, assignees.length - maxVisible)
  
  return { visible, hidden, total: assignees.length }
}

export function UnifiedGanttChart({
  tasks,
  viewMode,
  currentPeriod,
  projectFilter,
  projects,
  timelineMonths,
  onNavigatePeriodAction,
  onTaskCreatedAction,
  onEditTaskAction,
  onDeleteTaskAction,
  onStatusUpdateAction,
  onNotesSubmit,
  isExpanded = true,
  onToggleExpandAction
}: UnifiedGanttChartProps) {
  const [individualExpandedStates, setIndividualExpandedStates] = useState<Record<string, boolean>>({})

  // Initialize individual expanded states for all tasks
  useEffect(() => {
    const initialStates: Record<string, boolean> = {}
    tasks.forEach(task => {
      initialStates[task.id] = isExpanded
    })
    setIndividualExpandedStates(initialStates)
  }, [tasks, isExpanded])

  const getTimelineTitle = () => {
    if (projectFilter !== "all") {
      return `${projects.find(p => p.id === projectFilter)?.name || 'Unknown Project'} Timeline`
    }
    
    switch (viewMode) {
      case "daily":
        return `Daily - ${currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
      case "yearly":
        return `Yearly - ${currentPeriod.toLocaleDateString("en-PH", { year: "numeric" })}`
      case "monthly":
        return `Monthly - ${currentPeriod.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`
      default:
        return "Full Timeline"
    }
  }

  const handleTodayClick = () => {
    // Get current date in Philippines timezone properly
    const now = new Date()
    const philippinesOffset = 8 * 60 // Philippines is UTC+8
    const localOffset = now.getTimezoneOffset()
    const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
    // This will trigger navigation in parent component
    window.dispatchEvent(new CustomEvent('navigate-to-today', { detail: philippinesTime }))
  }

  const toggleIndividualExpanded = (taskId: string) => {
    setIndividualExpandedStates(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const getTodayPosition = () => {
    // Get current date in Philippines timezone properly
    const now = new Date()
    const philippinesOffset = 8 * 60 // Philippines is UTC+8
    const localOffset = now.getTimezoneOffset()
    const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
    const today = new Date(philippinesTime.getFullYear(), philippinesTime.getMonth(), philippinesTime.getDate())
    
    let todayPosition = 0
    let isTodayVisible = false

    if (viewMode === "yearly") {
      // For yearly view, find which year contains today
      for (let i = 0; i < timelineMonths.length; i++) {
        const yearStart = new Date(timelineMonths[i].date)
        yearStart.setHours(0, 0, 0, 0) // Start of day
        const yearEnd = new Date(timelineMonths[i].endDate)
        yearEnd.setHours(23, 59, 59, 999) // End of day
        
        // Check if today falls within this year
        if (today >= yearStart && today <= yearEnd) {
          // Today is in this year, position it based on day of year
          const yearColumnWidth = 100 / timelineMonths.length // Each year takes up equal width
          const yearStartPosition = i * yearColumnWidth
          
          // Calculate position within the year
          const yearStartTime = yearStart.getTime()
          const yearEndTime = yearEnd.getTime()
          const todayTime = today.getTime()
          const yearProgress = (todayTime - yearStartTime) / (yearEndTime - yearStartTime)
          const positionWithinYear = yearProgress * yearColumnWidth
          
          todayPosition = yearStartPosition + positionWithinYear
          isTodayVisible = true
          break
        }
      }
    } else if (viewMode === "monthly") {
      // For monthly view, find which month contains today
      for (let i = 0; i < timelineMonths.length; i++) {
        const monthStart = new Date(timelineMonths[i].date)
        monthStart.setHours(0, 0, 0, 0) // Start of day
        const monthEnd = new Date(timelineMonths[i].endDate)
        monthEnd.setHours(23, 59, 59, 999) // End of day
        
        // Check if today falls within this month
        if (today >= monthStart && today <= monthEnd) {
          // Today is in this month, calculate position within the month
          const monthColumnWidth = 100 / timelineMonths.length // Each month takes up equal width
          const monthStartPosition = i * monthColumnWidth
          
          // Calculate the day within the month for more precise positioning
          const monthTotalDays = monthEnd.getDate()
          const todayDayOfMonth = today.getDate()
          const dayRatio = (todayDayOfMonth - 1) / (monthTotalDays - 1) // -1 because days are 1-indexed
          const positionWithinMonth = dayRatio * monthColumnWidth
          
          todayPosition = monthStartPosition + positionWithinMonth
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

    return { position: todayPosition, visible: isTodayVisible }
  }

  const todayLine = getTodayPosition()

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3 min-w-0 flex-1">
            <CardTitle className="dark:text-white text-sm sm:text-lg truncate">
              {getTimelineTitle()}
            </CardTitle>
            <Badge variant="outline" className="text-xs w-fit">
              {tasks.length} tasks
            </Badge>
          </div>
          
          {/* Controls Section - Stack vertically on mobile */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 flex-shrink-0">
            {/* Top row: Expand/Collapse and Add Task */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              {/* Expand/Collapse Controls */}
              {onToggleExpandAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleExpandAction}
                  className="h-8 px-2 sm:h-10 sm:px-3 text-xs sm:text-sm"
                  title={isExpanded ? "Collapse All" : "Expand All"}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Expand All</span>
                    </>
                  )}
                </Button>
              )}
              
              {/* Desktop Add Task Button */}
              <div className="hidden sm:block">
                <TaskFormModal 
                  onTaskCreated={onTaskCreatedAction} 
                  defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
                />
              </div>
            </div>
            
            {/* Navigation Controls - Always give full width */}
            {viewMode !== "full" && (
              <div className="flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigatePeriodAction("prev")}
                  className="h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTodayClick}
                  className="h-8 px-2 sm:h-10 sm:px-3 text-xs sm:text-sm flex-1 sm:flex-none min-w-0 max-w-[120px] sm:max-w-none"
                  title="Go to current period (Philippines time)"
                >
                  <span className="truncate">Today</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigatePeriodAction("next")}
                  className="h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6 overflow-hidden">
        {/* Timeline Headers */}
        <TimelineHeaders viewMode={viewMode} currentPeriod={currentPeriod} timelineMonths={timelineMonths} />
        
        {/* Mobile Timeline Header */}
        <div className="sm:hidden mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {viewMode === "daily" 
                ? currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                : viewMode === "yearly"
                  ? currentPeriod.toLocaleDateString("en-PH", { year: "numeric" })
                  : viewMode === "monthly"
                    ? currentPeriod.toLocaleDateString("en-PH", { month: "long", year: "numeric" })
                    : "Timeline Overview"
              }
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </div>
            {/* Mobile Add Task Button */}
            <div className="mt-2">
              <TaskFormModal 
                onTaskCreated={onTaskCreatedAction} 
                defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
              />
            </div>
          </div>
        </div>

        {/* Task Rows */}
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <TaskRowComponent
              key={task.id}
              task={task}
              index={index}
              timelineMonths={timelineMonths}
              viewMode={viewMode}
              onEditTaskAction={onEditTaskAction}
              onDeleteTaskAction={onDeleteTaskAction}
              onStatusUpdateAction={onStatusUpdateAction}
              onNotesSubmit={onNotesSubmit}
              isExpanded={individualExpandedStates[task.id] ?? isExpanded}
              onToggleExpanded={() => toggleIndividualExpanded(task.id)}
              todayLine={todayLine}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Separate component for timeline headers
function TimelineHeaders({ viewMode, currentPeriod, timelineMonths }: {
  viewMode: ViewMode
  currentPeriod: Date
  timelineMonths: TimelineMonth[]
}) {
  return (
    <>
      {/* Timeline Header - Desktop */}
      <div className="hidden sm:grid grid-cols-12 gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="col-span-4 text-sm font-medium text-gray-600 dark:text-gray-400">Task Details</div>
        <div className="col-span-8">
          {viewMode === "daily" ? (
            <>
              <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                Daily View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric", month: "long" })}
              </div>
              <div 
                className="grid gap-1 overflow-hidden"
                style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, 1fr)` }}
              >
                {timelineMonths.map((day, index) => (
                  <div key={day.label + index} className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 min-w-0">
                    <div className="truncate">{day.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : viewMode === "yearly" ? (
            <>
              <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                Yearly View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric" })}
              </div>
              <div 
                className="grid gap-1 overflow-hidden"
                style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, 1fr)` }}
              >
                {timelineMonths.map((year, index) => (
                  <div key={year.label + index} className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 min-w-0">
                    <div className="truncate">{year.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : viewMode === "monthly" ? (
            <>
              <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                Monthly View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric" })}
              </div>
              <div 
                className="grid gap-1 overflow-hidden"
                style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, 1fr)` }}
              >
                {timelineMonths.map((month, index) => (
                  <div key={month.label + index} className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 min-w-0">
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
                <>
                  {/* Year headers */}
                  <div 
                    className="grid gap-0 mb-2"
                    style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, 1fr)` }}
                  >
                    {timelineMonths.reduce((acc: React.ReactElement[], month, index) => {
                      const prevMonth = timelineMonths[index - 1]
                      const isNewYear = !prevMonth || prevMonth.year !== month.year
                      
                      if (isNewYear) {
                        const yearMonths = timelineMonths.filter(m => m.year === month.year)
                        acc.push(
                          <div 
                            key={`year-${month.year}`} 
                            className="text-sm font-bold text-gray-800 dark:text-gray-200 text-center border-r border-gray-300 dark:border-gray-600"
                            style={{ gridColumn: `span ${yearMonths.length}` }}
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
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, 1fr)` }}
                  >
                    {timelineMonths.map((month, index) => (
                      <div 
                        key={month.label + month.date.getFullYear()} 
                        className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1"
                      >
                        <div className="truncate" title={month.label}>{month.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Grid lines for spacing */}
      <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-gray-400 dark:text-gray-500">
        <div className="col-span-4"></div>
        <div className="col-span-8">
          {viewMode === "daily" ? (
            <div 
              className="grid gap-1 overflow-hidden"
              style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, 1fr)` }}
            >
              {timelineMonths.map((day, index) => (
                <div key={day.label + index} className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30 min-w-0"></div>
              ))}
            </div>
          ) : viewMode === "yearly" ? (
            <div 
              className="grid gap-1 overflow-hidden"
              style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, 1fr)` }}
            >
              {timelineMonths.map((year, index) => (
                <div key={year.label + index} className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30 min-w-0"></div>
              ))}
            </div>
          ) : (
            <div 
              className="grid gap-1 overflow-hidden"
              style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, 1fr)` }}
            >
              {timelineMonths.map((_, index) => (
                <div key={index} className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30 min-w-0"></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Individual Task Row Component
interface TaskRowComponentProps {
  task: EnhancedTask
  index: number
  timelineMonths: TimelineMonth[]
  viewMode: ViewMode
  onEditTaskAction: (task: EnhancedTask) => void
  onDeleteTaskAction: (task: EnhancedTask) => void
  onStatusUpdateAction?: (taskId: string, status: string) => void
  onNotesSubmit?: (taskId: string, notes: string) => Promise<void>
  isExpanded: boolean
  onToggleExpanded: () => void
  todayLine: { position: number, visible: boolean }
}

function TaskRowComponent({
  task,
  index,
  timelineMonths,
  viewMode,
  onEditTaskAction,
  onDeleteTaskAction,
  onStatusUpdateAction,
  onNotesSubmit,
  isExpanded,
  onToggleExpanded,
  todayLine
}: TaskRowComponentProps) {
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  
  const position = getTaskPosition(task, timelineMonths)
  const overdue = task.is_overdue || false
  const daysUntilDeadline = task.days_until_deadline
  const iconType = getStatusIconType(task.status, overdue)
  const completedDate = formatCompletedDate(task.completed_at)
  const assigneeDisplay = getAssigneeDisplay(task.assignee, task.assignee_headcounts, 2)
  const capitalizedStatus = capitalizeStatus(task.status)

  const handleStatusChange = (newStatus: string) => {
    if (onStatusUpdateAction) {
      onStatusUpdateAction(task.id, newStatus)
    }
  }

  const handleNotesSubmit = async (taskId: string, notes: string) => {
    if (onNotesSubmit) {
      await onNotesSubmit(taskId, notes)
    }
  }

  // Collapsed view for when isExpanded is false
  if (!isExpanded) {
    return (
      <div key={task.id} className={`flex items-center justify-between py-3 px-4 rounded-lg transition-all duration-200 border ${
        index % 2 === 0 
          ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700' 
          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
      }`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Individual Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 shrink-0"
            onClick={onToggleExpanded}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          
          {/* Task Key Badge */}
          {task.task_key && (
            <Badge variant="secondary" className="text-xs px-2 py-1 font-mono shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {task.task_key}
            </Badge>
          )}
          
          {/* Task Title */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">{task.title}</h3>
          
          {/* Status Badge */}
          <Badge className={`${getStatusColor(task.status, overdue)} text-xs px-2 py-1 shrink-0 font-medium`}>
            <StatusIcon iconType={iconType} overdue={overdue} />
            <span className="ml-1">{capitalizedStatus}</span>
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {/* Project Name */}
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
            {task.project_name}
          </span>
          
          {/* Assignee Info */}
          {task.assignee && (
            <div className="hidden md:flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-400" />
              <Badge variant="outline" className="text-xs px-2 py-0.5 h-auto">
                {assigneeDisplay.visible[0]?.name} ({assigneeDisplay.visible[0]?.count})
                {assigneeDisplay.total > 1 && ` +${assigneeDisplay.total - 1}`}
              </Badge>
            </div>
          )}
          
          {/* Days Remaining */}
          {daysUntilDeadline !== null && (
            <div className={`flex items-center gap-1 text-xs font-medium ${overdue ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              <Clock className="h-3 w-3" />
              <span>
                {overdue
                  ? `${Math.abs(daysUntilDeadline || 0)}d overdue`
                  : `${daysUntilDeadline}d left`}
              </span>
            </div>
          )}
          
          {/* Completed Date */}
          {task.status === 'completed' && completedDate && (
            <div className="text-xs text-green-600 dark:text-green-400 font-medium hidden lg:block">
              ✓ {completedDate}
            </div>
          )}
          
          {/* Dropdown Menu */}
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEditTaskAction(task)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setNotesModalOpen(true)}>
                <StickyNote className="h-4 w-4 mr-2" />
                Task Notes
              </DropdownMenuItem>
              
              {/* Status Update Section */}
              <DropdownMenuItem asChild>
                <div className="px-2 py-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Select
                      value={task.status || "planning"}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="h-6 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onDeleteTaskAction(task)}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Task Notes Modal */}
        <TaskNotesModal
          open={notesModalOpen}
          onOpenChangeAction={setNotesModalOpen}
          task={task}
          onNotesSubmitAction={handleNotesSubmit}
        />
      </div>
    )
  }

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
              <div className="flex items-center gap-2">
                {/* Individual Expand/Collapse Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={onToggleExpanded}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                {task.task_key && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-mono">
                    {task.task_key}
                  </Badge>
                )}
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</h3>
              </div>
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
                <DropdownMenuItem onClick={() => onEditTaskAction(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setNotesModalOpen(true)}>
                  <StickyNote className="h-4 w-4 mr-2" />
                  Task Notes
                </DropdownMenuItem>
                
                {/* Status Update Section */}
                <DropdownMenuItem asChild>
                  <div className="px-2 py-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Status:</span>
                      <Select
                        value={task.status || "planning"}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="h-6 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => onDeleteTaskAction(task)}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Show detailed content for expanded state */}
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(task.status, overdue)}>
              <span className="flex items-center space-x-1">
                <StatusIcon iconType={iconType} overdue={overdue} />
                <span>{capitalizedStatus}</span>
              </span>
            </Badge>
          </div>

          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                {formatDate(task.start_date)} - {formatDate(task.end_date)}
              </span>
            </div>
            
            {/* Enhanced Assignee Display */}
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {task.assignee ? (
                <div className="flex items-center gap-1">
                  <div className="flex flex-wrap gap-1">
                    {assigneeDisplay.visible.map((assigneeData, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs px-1 py-0 h-auto"
                      >
                        {assigneeData.name} ({assigneeData.count})
                      </Badge>
                    ))}
                  </div>
                  {assigneeDisplay.hidden > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 px-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          +{assigneeDisplay.hidden} more
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {task.assignee.split(', ').slice(2).map((assignee, index) => {
                          const role = assignee.trim()
                          const count = task.assignee_headcounts?.[role] || 1
                          return (
                            <DropdownMenuItem key={index} className="text-xs">
                              {role} ({count})
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <span className="text-gray-400">({assigneeDisplay.total} roles)</span>
                </div>
              ) : (
                <span>Unassigned</span>
              )}
            </div>
            
            {/* Days remaining and completed date */}
            {daysUntilDeadline !== null && (
              <div className={`flex items-center ${overdue ? "text-red-600 dark:text-red-400" : ""}`}>
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  {overdue
                    ? `${Math.abs(daysUntilDeadline || 0)} days overdue`
                    : `${daysUntilDeadline} days remaining`}
                </span>
              </div>
            )}
            
            {/* Completed At Display */}
            {task.status === 'completed' && completedDate && (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                Completed at: {completedDate}
              </div>
            )}
          </div>
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

            {/* Today line */}
            {todayLine.visible && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-30"
                style={{ left: `${todayLine.position}%` }}
                title={`Today - ${new Date().toLocaleDateString("en-PH")}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout - Enhanced Responsive Design */}
      <div className={`sm:hidden p-3 rounded-lg border-l-4 transition-colors ${
        overdue ? 'border-l-red-500' : 
        task.status === 'completed' ? 'border-l-green-500' :
        task.status === 'in-progress' ? 'border-l-orange-500' : 'border-l-blue-500'
      } ${
        index % 2 === 0 
          ? 'bg-white dark:bg-gray-900' 
          : 'bg-gray-50 dark:bg-gray-800'
      }`}>
        {/* Mobile Task Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 mr-2">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Individual Expand/Collapse Button for Mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 shrink-0"
                onClick={onToggleExpanded}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              {task.task_key && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-mono shrink-0">
                  {task.task_key}
                </Badge>
              )}
              <h3 className="text-sm font-medium text-gray-900 dark:text-white break-words flex-1 min-w-0">{task.title}</h3>
            </div>
            {/* Status Badge Row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={`${getStatusColor(task.status, overdue)} text-xs px-2 py-1 shrink-0`}>
                <StatusIcon iconType={iconType} overdue={overdue} />
                <span className="ml-1">{capitalizedStatus}</span>
              </Badge>
              {/* Project name for mobile */}
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate">
                {task.project_name}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 shrink-0"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEditTaskAction(task)} className="text-xs">
                <Edit className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setNotesModalOpen(true)} className="text-xs">
                <StickyNote className="h-3 w-3 mr-2" />
                Notes
              </DropdownMenuItem>
              
              {/* Mobile Status Update */}
              <DropdownMenuItem asChild>
                <div className="px-2 py-1.5">
                  <Select
                    value={task.status || "planning"}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="h-6 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  {task.status === 'completed' && completedDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Completed: {completedDate}
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onDeleteTaskAction(task)}
                className="text-red-600 dark:text-red-400 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Enhanced Details for Mobile */}
        <>
          {/* Timeline Bar - Mobile - More Prominent and Responsive */}
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
              {todayLine.visible && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-30"
                  style={{ left: `${todayLine.position}%` }}
                />
              )}
            </div>
          </div>

          {/* Detailed Info Rows - Mobile Optimized */}
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {/* Date Range */}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="break-all">{formatDate(task.start_date)} - {formatDate(task.end_date)}</span>
            </div>
            
            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center gap-1 flex-wrap">
                <Users className="h-3 w-3 shrink-0" />
                <div className="flex items-center gap-1 flex-wrap">
                  {assigneeDisplay.visible.slice(0, 2).map((assigneeData, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 h-auto"
                    >
                      {assigneeData.name} ({assigneeData.count})
                    </Badge>
                  ))}
                  {assigneeDisplay.total > 2 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 px-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          +{assigneeDisplay.total - 2} more
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {task.assignee.split(', ').slice(2).map((assignee, index) => {
                          const role = assignee.trim()
                          const count = task.assignee_headcounts?.[role] || 1
                          return (
                            <DropdownMenuItem key={index} className="text-xs">
                              {role} ({count})
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )}
            
            {/* Deadline info */}
            {daysUntilDeadline !== null && (
              <div className={`flex items-center gap-1 font-medium ${overdue ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                <Clock className="h-3 w-3" />
                <span>
                  {overdue
                    ? `${Math.abs(daysUntilDeadline || 0)} days overdue`
                    : `${daysUntilDeadline} days remaining`}
                </span>
              </div>
            )}
            
            {/* Completed timestamp */}
            {task.status === 'completed' && completedDate && (
              <div className="text-green-600 dark:text-green-400 font-medium">
                Completed: {completedDate}
              </div>
            )}
            
            {/* Description if available */}
            {task.description && (
              <div className="text-gray-700 dark:text-gray-300 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {task.description}
              </div>
            )}
          </div>
        </>
      </div>
      
      {/* Task Notes Modal */}
      <TaskNotesModal
        open={notesModalOpen}
        onOpenChangeAction={setNotesModalOpen}
        task={task}
        onNotesSubmitAction={handleNotesSubmit}
      />
    </div>
  )
}
