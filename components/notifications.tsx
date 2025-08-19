"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  FileText,
  RefreshCw,
  ImageIcon,
  Activity,
  Edit,
  Trash2,
  Square,
  CheckSquare,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNotificationsQuery } from "@/lib/hooks/useNotificationsOptimized"
import { useDeadlineNotifications } from "@/lib/hooks/useDeadlineNotifications"
import { toast } from "@/lib/toast-manager"

// Add throttling utility
const createThrottledFunction = <T extends unknown[]>(func: (...args: T) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  
  return (...args: T) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

interface NotificationsProps {
  onTabChangeAction?: (tab: string) => void
}

export function Notifications({ onTabChangeAction }: NotificationsProps = {}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [showDeadlines, setShowDeadlines] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const lastRefreshRef = useRef<number>(0)

  // Use optimized notifications hook - replaces all the manual fetching logic
  const { 
    notifications: systemNotifications, 
    isLoading: loading, 
    isFetching: refreshing,
    refetch,
    error 
  } = useNotificationsQuery()

  // Throttled refresh function
  const throttledRefresh = useMemo(() => 
    createThrottledFunction(async () => {
      const now = Date.now()
      if (now - lastRefreshRef.current < 30000) { // 30 seconds
        toast.success("Data is already up to date")
        return
      }

      try {
        await refetch()
        lastRefreshRef.current = now
        toast.success("Notifications refreshed successfully")
      } catch (error) {
        console.error('Error refreshing notifications:', error)
        toast.error("Failed to refresh notifications")
      }
    }, 3000), // 3 second throttle
    [refetch]
  )

  const handleRefresh = useCallback(() => {
    throttledRefresh()
  }, [throttledRefresh])

  // Deadline notifications
  const {
    upcomingTasks,
    isLoading: deadlineLoading,
    checkDeadlines,
    lastChecked
  } = useDeadlineNotifications()

  // Selection handlers
  const toggleNotificationSelection = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId)
    } else {
      newSelected.add(notificationId)
    }
    setSelectedNotifications(newSelected)
  }

  const selectAllNotifications = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const deleteSelectedNotifications = () => {
    if (selectedNotifications.size === 0) return
    
    // Here you would typically call an API to delete the notifications
    // For now, we'll just show a toast
    toast.success(`Deleted ${selectedNotifications.size} notifications`)
    setSelectedNotifications(new Set())
    setIsSelectionMode(false)
  }

  // Handle notification click to redirect to specific items
  const handleNotificationClick = (notification: {
    id: string
    type: string
    project_id?: string
    title: string
    message: string
    timestamp: string
    project_name?: string
    metadata?: Record<string, unknown>
  }) => {
    if (isSelectionMode) return // Don't navigate when in selection mode
    
    // Navigate based on notification type and content
    switch (notification.type) {
      case 'report':
        // Navigate to reports tab with specific report highlighted
        if (onTabChangeAction) {
          onTabChangeAction('reports')
          // Store report ID for reports page to highlight/scroll to
          if (notification.metadata?.report_id) {
            localStorage.setItem('highlightReportId', notification.metadata.report_id as string)
          }
        }
        break
      case 'task':
        // Navigate to gantt chart to view specific task
        if (onTabChangeAction) {
          onTabChangeAction('gantt')
          // Store task ID for gantt chart to highlight/focus
          if (notification.metadata?.task_id) {
            localStorage.setItem('highlightTaskId', notification.metadata.task_id as string)
          }
        }
        break
      case 'deadline':
        // Navigate to calendar with specific date and task
        if (onTabChangeAction) {
          onTabChangeAction('calendar')
          // Store deadline date and task info
          const deadlineDate = notification.timestamp.split('T')[0]
          localStorage.setItem('navigateToDate', deadlineDate)
          localStorage.setItem('navigateToType', 'deadline')
          if (notification.metadata?.task_id) {
            localStorage.setItem('highlightTaskId', notification.metadata.task_id as string)
          }
        }
        break
      case 'project':
        // Navigate to projects with specific project highlighted
        if (onTabChangeAction) {
          onTabChangeAction('projects')
          // Store project ID for projects page to highlight
          if (notification.project_id) {
            localStorage.setItem('highlightProjectId', notification.project_id)
          }
        }
        break
      case 'photo':
        // Navigate to calendar where photos are displayed
        if (onTabChangeAction) {
          onTabChangeAction('calendar')
          // Store the specific date and photo info
          const photoDate = notification.timestamp.split('T')[0]
          localStorage.setItem('navigateToDate', photoDate)
          localStorage.setItem('navigateToType', 'photo')
          if (notification.metadata?.photo_id) {
            localStorage.setItem('highlightPhotoId', notification.metadata.photo_id as string)
          }
        }
        break
      case 'event':
        // Navigate to calendar with specific event highlighted
        if (onTabChangeAction) {
          onTabChangeAction('calendar')
          const eventDate = notification.timestamp.split('T')[0]
          localStorage.setItem('navigateToDate', eventDate)
          localStorage.setItem('navigateToType', 'event')
          if (notification.metadata?.event_id) {
            localStorage.setItem('highlightEventId', notification.metadata.event_id as string)
          }
        }
        break
      default:
        // Default to dashboard
        if (onTabChangeAction) {
          onTabChangeAction('dashboard')
        }
    }
    
    // Show success message with more specific information
    const targetPage = notification.type === 'photo' ? 'calendar' : 
                      notification.type === 'report' ? 'reports' : 
                      notification.type === 'task' ? 'gantt chart' :
                      notification.type === 'deadline' ? 'calendar' :
                      notification.type === 'event' ? 'calendar' :
                      notification.type === 'project' ? 'projects' : 
                      'dashboard'
    
    const itemInfo = notification.metadata?.task_id ? 'task' :
                    notification.metadata?.report_id ? 'report' :
                    notification.metadata?.event_id ? 'event' :
                    notification.metadata?.photo_id ? 'photo' :
                    notification.project_id ? 'project' : 'item'
    
    toast.success(`Navigating to ${targetPage} to view ${itemInfo}`)
  }

  const enterSelectionMode = () => {
    setIsSelectionMode(true)
    setSelectedNotifications(new Set())
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedNotifications(new Set())
  }

  // Handle error with useEffect to avoid setState during render
  useEffect(() => {
    if (error) {
      console.error('Notifications error:', error)
      toast.error('Failed to load notifications')
    }
  }, [error])

  // Convert optimized notifications to match the old interface for filtering
  const notifications = systemNotifications.map(notif => ({
    id: notif.id,
    type: notif.type,
    title: notif.title,
    message: notif.description || notif.title, // Use description when available, fallback to title
    project_id: notif.projectId,
    project_name: notif.project,
    timestamp: notif.timestamp,
    priority: notif.type === 'task' ? (notif.priority || 'low') : undefined, // Only tasks have priority, default to low
    metadata: {
      file_name: notif.description,
      status: notif.status,
      user_name: notif.description?.includes('Assigned to') ? notif.description.split('Assigned to ')[1]?.split(' •')[0] : undefined
    }
  }))

  // Memoized filtering logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.project_name && notification.project_name.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesType = typeFilter === "all" || notification.type === typeFilter
      
      // Time-based filtering
      const now = new Date()
      const notificationDate = new Date(notification.timestamp)
      const hoursDiff = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60)
      
      const matchesTime = 
        timeFilter === "all" ||
        (timeFilter === "today" && hoursDiff <= 24) ||
        (timeFilter === "week" && hoursDiff <= 24 * 7) ||
        (timeFilter === "month" && hoursDiff <= 24 * 30)

      return matchesSearch && matchesType && matchesTime
    })
  }, [notifications, searchTerm, typeFilter, timeFilter])

  // Memoized stats calculations
  const { totalCount, taskCount, recentCount } = useMemo(() => {
    const total = notifications.length
    const tasks = notifications.filter(n => n.type === 'task').length
    const now = new Date()
    const recent = notifications.filter(n => {
      const notificationDate = new Date(n.timestamp)
      const hoursDiff = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60)
      return hoursDiff <= 24
    }).length

    return {
      totalCount: total,
      taskCount: tasks,
      recentCount: recent
    }
  }, [notifications])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "photo":
        return <ImageIcon className="h-4 w-4 text-blue-500" />
      case "report":
        return <FileText className="h-4 w-4 text-orange-500" />
      case "task":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "task_update":
        return <Edit className="h-4 w-4 text-blue-500" />
      case "event":
        return <Calendar className="h-4 w-4 text-purple-500" />
      case "project":
        return <Activity className="h-4 w-4 text-indigo-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "1 day ago"
    if (diffInDays < 7) return `${diffInDays} days ago`
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks === 1) return "1 week ago"
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="p-3 sm:p-5 lg:p-9 space-y-4 sm:space-y-5 lg:space-y-7 overflow-y-auto h-full bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
      {/* Modern Header with Glassmorphism */}
      <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 lg:p-7 rounded-xl shadow-lg border border-gray-200/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900">Notifications</h1>
                <p className="text-base lg:text-lg text-gray-600 mt-1">Track recent activities and updates</p>
              </div>
            </div>
          </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:space-x-2">
          {isSelectionMode ? (
            <>
              <Button
                variant="outline"
                onClick={selectAllNotifications}
                size="default"
                className="h-10 px-5 py-2"
              >
                {selectedNotifications.size === filteredNotifications.length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">{selectedNotifications.size === filteredNotifications.length ? 'Deselect' : 'Select All'}</span>
                <span className="sm:hidden">All</span>
              </Button>
              <Button
                variant="destructive"
                onClick={deleteSelectedNotifications}
                disabled={selectedNotifications.size === 0}
                size="default"
                className="h-10 px-5 py-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedNotifications.size})
              </Button>
              <Button
                variant="ghost"
                onClick={exitSelectionMode}
                size="default"
                className="h-10 px-5 py-2"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={enterSelectionMode}
                disabled={filteredNotifications.length === 0}
                size="default"
                className="h-10 px-5 py-2"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                size="default"
                className="h-10 px-5 py-2"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                <span className="sm:hidden">Sync</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeadlines(!showDeadlines)}
                size="default"
                className="h-10 px-4 py-2"
              >
                <Clock className="h-4 w-4 mr-2" />
                Deadlines
              </Button>
            </>
          )}
        </div>
      </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading activities...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
            <Card className="border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Activities</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalCount}</p>
                    <p className="text-sm text-gray-600">All notifications</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Last 24 Hours</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{recentCount}</p>
                    <p className="text-sm text-gray-600">Recent activity</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Task Activities</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{taskCount}</p>
                    <p className="text-sm text-gray-600">Task updates</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Projects Active</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{new Set(notifications.map(n => n.project_id).filter(Boolean)).size}</p>
                    <p className="text-sm text-gray-600">With notifications</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deadlines Panel */}
          {showDeadlines && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Task Deadlines
                </CardTitle>
                <CardDescription className="text-xs">
                  Tasks due within 7 days with project details and priority
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status Section */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <h4 className="font-medium text-base">Deadline Monitoring</h4>
                    <p className="text-sm text-gray-600">
                      {deadlineLoading ? 'Checking deadlines...' : 
                       lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 
                       'Not yet checked'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {upcomingTasks.length} tasks with deadlines in next 7 days
                    </p>
                  </div>
                  <div className="ml-4">
                    <Button 
                      size="default" 
                      variant="outline"
                      onClick={checkDeadlines}
                      disabled={deadlineLoading}
                      className="h-12 px-6"
                    >
                      {deadlineLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Check Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Upcoming Tasks */}
                {upcomingTasks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">Upcoming Deadlines</h4>
                    {upcomingTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTabChangeAction && onTabChangeAction('gantt')}
                        className="w-full p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left group"
                        title="Click to view in Gantt Chart"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-base group-hover:text-orange-700">{task.project_name}</h5>
                            <p className="text-sm text-gray-700 mt-1 group-hover:text-orange-600">{task.title}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="capitalize">{task.status}</span>
                              <span className="capitalize">{task.priority} priority</span>
                              <span>{new Date(task.end_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <Badge 
                              variant={task.daysRemaining === 0 ? "destructive" : 
                                     task.daysRemaining === 1 ? "default" : "secondary"}
                            >
                              {task.daysRemaining === 0 ? '🚨 Due Today' : 
                               task.daysRemaining === 1 ? '⚠️ 1 day left' : 
                               `⏰ ${task.daysRemaining} days`}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No upcoming tasks */}
                {upcomingTasks.length === 0 && !deadlineLoading && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <div>
                        <h4 className="font-medium text-green-800 text-base">All Good!</h4>
                        <p className="text-sm text-green-700">
                          No tasks with deadlines in the next 7 days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <div className="flex gap-3 sm:gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32 sm:w-36 h-10">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="photo">Photos</SelectItem>
                    <SelectItem value="report">Reports</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                    <SelectItem value="project">Projects</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-28 sm:w-32 h-10">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/50">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Recent Activities</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">Latest system activities and project updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-blue-300 bg-gradient-to-r from-white to-gray-50/50 border-gray-200 cursor-pointer group"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {isSelectionMode && (
                      <div className="absolute top-3 left-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleNotificationSelection(notification.id)
                          }}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {selectedNotifications.has(notification.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    <div className={`flex h-full ${isSelectionMode ? 'pl-8' : ''}`}>
                      {/* Icon column */}
                      <div className="flex-shrink-0 mr-4 mt-1">
                        <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 group-hover:bg-blue-100 transition-colors">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      
                      {/* Content column */}
                      <div className="flex-1 min-w-0">
                        {/* Header with timestamp */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            {/* Title */}
                            <h3 className="text-base font-semibold text-gray-900 mb-1 break-words group-hover:text-blue-700 transition-colors">
                              {notification.title}
                            </h3>
                          </div>
                          <div className="text-xs text-gray-500 ml-3 flex-shrink-0 bg-gray-100 px-2 py-1 rounded-full">
                            {getTimeAgo(notification.timestamp)}
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed break-words">
                          {notification.message && notification.message !== notification.title ? 
                            notification.message : 
                            `New activity detected in ${notification.project_name || 'project'} - Check for updates and progress changes.`}
                        </p>

                        {/* Footer info with enhanced styling */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm space-y-2 sm:space-y-0">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center text-gray-600 bg-gray-50 px-3 py-1 rounded-lg border">
                              <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                              {notification.project_name || 'Unknown Project'}
                            </span>
                            {notification.metadata?.user_name && (
                              <span className="flex items-center text-gray-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                                <Users className="h-4 w-4 mr-2 text-orange-500" />
                                {notification.metadata.user_name}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 italic">
                            Click to view details
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredNotifications.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
                  <p className="text-sm text-gray-500">Activities will appear here as your team works on projects</p>
                  <p className="text-xs text-gray-400 mt-2">Try adjusting your search or filters to see more results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
