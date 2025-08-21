"use client"

import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, Clock, MoreVertical, Edit, Trash2, CheckCircle, Play, Pause, AlertTriangle, ChevronDown, ChevronUp, StickyNote } from "lucide-react"
import { EnhancedTask, TimelineMonth, ViewMode } from "./types"
import { getStatusColor, getStatusIconType, formatDate, getTaskPosition, getProjectBarColor } from "./utils"
import { TaskNotesModal } from "./TaskNotesModal"

interface TaskRowProps {
  task: EnhancedTask
  index: number
  timelineMonths: TimelineMonth[]
  viewMode: ViewMode
  onEditTaskAction: (task: EnhancedTask) => void
  onDeleteTaskAction: (task: EnhancedTask) => void
  onStatusUpdateAction?: (taskId: string, status: string) => void
  onNotesSubmit?: (taskId: string, notes: string) => Promise<void>
  isExpanded?: boolean
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

export function TaskRow({
  task,
  index,
  timelineMonths,
  viewMode,
  onEditTaskAction,
  onDeleteTaskAction,
  onStatusUpdateAction,
  onNotesSubmit,
  isExpanded = true
}: TaskRowProps) {
  const [individualExpanded, setIndividualExpanded] = useState(true)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  
  // Sync individual state with global expand when global state changes
  useEffect(() => {
    setIndividualExpanded(isExpanded)
  }, [isExpanded])
  
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

  // Use individual expanded state - this allows each task to be controlled independently
  const isTaskExpanded = individualExpanded

  const getTodayPosition = () => {
    // Get current date in Philippines timezone properly
    const now = new Date()
    const philippinesOffset = 8 * 60 // Philippines is UTC+8
    const localOffset = now.getTimezoneOffset()
    const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
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

  // Collapsed view for when isExpanded is false
  if (!isTaskExpanded) {
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
            onClick={() => setIndividualExpanded(true)}
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
                  onClick={() => setIndividualExpanded(false)}
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

          {/* Show/Hide detailed content based on expand state */}
          {isTaskExpanded && (
            <>
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
            </>
          )}
          
          {/* Collapsed view - always show basic status */}
          {!isTaskExpanded && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <StatusIcon iconType={iconType} overdue={overdue} />
                <span className="ml-1">{capitalizedStatus}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Timeline - Desktop */}
        <div className="col-span-8">
          <div className="overflow-x-auto">
            <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" 
                 style={{ 
                   minWidth: viewMode === "daily" ? '800px' : 
                            viewMode === "weekly" ? '600px' : 
                            viewMode === "monthly" ? '720px' :
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
                onClick={() => setIndividualExpanded(!individualExpanded)}
              >
                {individualExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
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

        {/* Enhanced Details for Mobile - Only show when expanded */}
        {isTaskExpanded && (
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
                      <span className="text-gray-400">+{assigneeDisplay.total - 2} more</span>
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
                      ? `${Math.abs(daysUntilDeadline)} days overdue`
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
        )}
        
        {/* Collapsed view info */}
        {!isTaskExpanded && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(task.start_date)} - {formatDate(task.end_date)}
            </span>
            {daysUntilDeadline !== null && (
              <span className={`flex items-center gap-1 ${overdue ? "text-red-600" : "text-blue-600"}`}>
                <Clock className="h-3 w-3" />
                {overdue ? `${Math.abs(daysUntilDeadline || 0)}d over` : `${daysUntilDeadline}d left`}
              </span>
            )}
          </div>
        )}
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
