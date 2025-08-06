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
  Settings,
  Eye,
  RefreshCw,
  ImageIcon,
  Activity,
  Edit,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useNotificationsQuery } from "@/lib/hooks/useNotificationsOptimized"
import { toast } from "react-hot-toast"

// Types for system notifications
interface SystemNotification {
  id: string
  type: 'photo' | 'report' | 'task' | 'event' | 'project' | 'task_update'
  title: string
  message: string
  project_id?: string
  project_name?: string
  timestamp: string
  priority: 'high' | 'medium' | 'low'
  metadata?: {
    file_name?: string
    task_title?: string
    event_title?: string
    status?: string
    user_name?: string
  }
}

const notificationSettings = [
  { id: "photos", label: "Photo Uploads", enabled: true },
  { id: "reports", label: "Report Uploads", enabled: true },
  { id: "tasks", label: "Task Activities", enabled: true },
  { id: "events", label: "Event Activities", enabled: true },
  { id: "projects", label: "Project Updates", enabled: true },
]

export function Notifications() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(notificationSettings)

  // Use optimized notifications hook - replaces all the manual fetching logic
  const { 
    notifications: systemNotifications, 
    isLoading: loading, 
    isFetching: refreshing,
    refetch: handleRefresh,
    error 
  } = useNotificationsQuery()

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
    message: notif.title, // Use title as message for consistency
    project_id: notif.projectId,
    project_name: notif.project,
    timestamp: notif.timestamp,
    priority: notif.priority || 'medium',
    metadata: {
      file_name: notif.description,
      status: notif.status,
      user_name: notif.description
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
      const matchesPriority = priorityFilter === "all" || notification.priority === priorityFilter

      return matchesSearch && matchesType && matchesPriority
    })
  }, [notifications, searchTerm, typeFilter, priorityFilter])

  // Memoized stats calculations
  const { totalCount, highPriorityCount, recentCount } = useMemo(() => {
    const total = notifications.length
    const highPriority = notifications.filter((n) => n.priority === "high").length
    const recent = notifications.filter((n) => {
      const notificationTime = new Date(n.timestamp)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      return notificationTime > oneDayAgo
    }).length

    return {
      totalCount: total,
      highPriorityCount: highPriority,
      recentCount: recent
    }
  }, [notifications])

  const toggleSetting = (id: string) => {
    setSettings(settings.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "photo":
        return <ImageIcon className="h-5 w-5 text-blue-500" />
      case "report":
        return <FileText className="h-5 w-5 text-orange-500" />
      case "task":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "task_update":
        return <Edit className="h-5 w-5 text-blue-500" />
      case "event":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "project":
        return <Activity className="h-5 w-5 text-indigo-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Activity</h1>
          <p className="text-gray-600">Track recent system activities and project updates</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading system activities...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Activities</p>
                    <p className="text-2xl font-bold">{totalCount}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last 24 Hours</p>
                    <p className="text-2xl font-bold">{recentCount}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold">{highPriorityCount}</p>
                  </div>
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Projects Active</p>
                    <p className="text-2xl font-bold">{notifications.filter(n => n.type === 'project').length}</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure which activities you want to track</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{setting.label}</span>
                      <Switch checked={setting.enabled} onCheckedChange={() => toggleSetting(setting.id)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by type" />
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
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activities List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest system activities and project updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start space-x-4 p-4 rounded-lg border transition-colors hover:bg-gray-50 bg-white border-gray-200"
                  >
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">{getTimeAgo(notification.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {notification.project_name && (
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {notification.project_name}
                            </span>
                          )}
                          {notification.metadata?.user_name && (
                            <span className="truncate max-w-xs">Assigned to: {notification.metadata.user_name}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredNotifications.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria, or refresh to check for new activities</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
