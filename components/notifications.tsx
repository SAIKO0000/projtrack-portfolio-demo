"use client"

import { useState, useMemo, useEffect } from "react"
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
import { toast } from "react-hot-toast"

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

  // Use optimized notifications hook - replaces all the manual fetching logic
  const { 
    notifications: systemNotifications, 
    isLoading: loading, 
    isFetching: refreshing,
    refetch,
    error 
  } = useNotificationsQuery()

  // Deadline notifications
  const {
    upcomingTasks,
    isLoading: deadlineLoading,
    checkDeadlines,
    lastChecked
  } = useDeadlineNotifications()

  const handleRefresh = () => {
    refetch()
  }

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
        // Navigate to reports tab
        if (onTabChangeAction) {
          onTabChangeAction('reports')
        }
        break
      case 'task':
        // Navigate to projects tab to view tasks
        if (onTabChangeAction) {
          onTabChangeAction('projects')
        }
        break
      case 'deadline':
        // Navigate to calendar
        if (onTabChangeAction) {
          onTabChangeAction('calendar')
        }
        break
      case 'project':
        // Navigate to projects
        if (onTabChangeAction) {
          onTabChangeAction('projects')
        }
        break
      case 'photo':
        // Navigate to calendar where photos are displayed
        if (onTabChangeAction) {
          onTabChangeAction('calendar')
          // Store the specific date in localStorage for calendar to use
          const photoDate = notification.timestamp.split('T')[0] // Extract date part
          localStorage.setItem('navigateToDate', photoDate)
          localStorage.setItem('navigateToType', 'photo')
        }
        break
      default:
        // Default to dashboard
        if (onTabChangeAction) {
          onTabChangeAction('dashboard')
        }
    }
    
    // Show success message
    const targetPage = notification.type === 'photo' ? 'calendar' : 
                      notification.type === 'report' ? 'reports' : 
                      notification.type === 'task' ? 'projects' : 
                      notification.type
    toast.success(`Navigating to ${targetPage}`)
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">System Activity</h1>
          <p className="text-sm text-gray-600">Track recent activities and updates</p>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:space-x-2">
          {isSelectionMode ? (
            <>
              <Button
                variant="outline"
                onClick={selectAllNotifications}
                size="sm"
                className="h-8"
              >
                {selectedNotifications.size === filteredNotifications.length ? (
                  <CheckSquare className="h-3 w-3 mr-1" />
                ) : (
                  <Square className="h-3 w-3 mr-1" />
                )}
                <span className="hidden sm:inline">{selectedNotifications.size === filteredNotifications.length ? 'Deselect' : 'Select All'}</span>
                <span className="sm:hidden">All</span>
              </Button>
              <Button
                variant="destructive"
                onClick={deleteSelectedNotifications}
                disabled={selectedNotifications.size === 0}
                size="sm"
                className="h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete ({selectedNotifications.size})
              </Button>
              <Button
                variant="ghost"
                onClick={exitSelectionMode}
                size="sm"
                className="h-8"
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
                size="sm"
                className="h-8"
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                Select
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                <span className="sm:hidden">Sync</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeadlines(!showDeadlines)}
                size="sm"
                className="h-8"
              >
                <Clock className="h-3 w-3 mr-1" />
                Deadlines
              </Button>
            </>
          )}
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
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Activities</p>
                    <p className="text-lg sm:text-2xl font-bold">{totalCount}</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last 24 Hours</p>
                    <p className="text-lg sm:text-2xl font-bold">{recentCount}</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Task Activities</p>
                    <p className="text-lg sm:text-2xl font-bold">{taskCount}</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Projects Active</p>
                    <p className="text-lg sm:text-2xl font-bold">{new Set(notifications.map(n => n.project_id).filter(Boolean)).size}</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
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
                      size="sm" 
                      variant="outline"
                      onClick={checkDeadlines}
                      disabled={deadlineLoading}
                    >
                      {deadlineLoading ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-10"
              />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-36 h-10">
                  <SelectValue placeholder="Type" />
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
                <SelectTrigger className="w-full sm:w-32 h-10">
                  <SelectValue placeholder="Time" />
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

          {/* Activities List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Activities</CardTitle>
              <CardDescription>Latest system activities and project updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="relative p-3 rounded border transition-colors hover:bg-gray-50 bg-white border-gray-200 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleNotificationSelection(notification.id)
                          }}
                          className="p-0.5 hover:bg-gray-100 rounded"
                        >
                          {selectedNotifications.has(notification.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    <div className={`flex h-full ${isSelectionMode ? 'pl-6' : ''}`}>
                      {/* Icon column */}
                      <div className="flex-shrink-0 mr-3 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content column */}
                      <div className="flex-1 min-w-0">
                        {/* Header with timestamp */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            {/* Title */}
                            <h3 className="text-base font-medium text-gray-900 mb-1 break-words">
                              {notification.title}
                            </h3>
                          </div>
                          <span className="text-sm text-gray-500 ml-2 flex-shrink-0">{getTimeAgo(notification.timestamp)}</span>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-600 mb-3 break-words">
                          {notification.message && notification.message !== notification.title ? 
                            notification.message : 
                            `Activity in ${notification.project_name || 'project'}`}
                        </p>

                        {/* Footer info */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 space-y-1 sm:space-y-0">
                          <span className="flex items-center break-words">
                            <Calendar className="h-4 w-4 mr-1" />
                            {notification.project_name || 'Unknown Project'}
                          </span>
                          {notification.metadata?.user_name && (
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {notification.metadata.user_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredNotifications.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bell className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No activities found</h3>
                  <p className="text-xs text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
