"use client"

import { useState } from "react"
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
  Info,
  Calendar,
  Users,
  FileText,
  Settings,
  X,
  Eye,
  EyeOff,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const notifications = [
  {
    id: 1,
    type: "deadline",
    title: "Project Deadline Approaching",
    message: "CSA Makati Building project is due in 3 days. Current progress: 75%",
    project: "Colegio San Agustin Makati 4-Storey Building",
    timestamp: "2024-01-16T09:30:00Z",
    read: false,
    priority: "high",
    actionRequired: true,
    assignedTo: "John Doe",
  },
  {
    id: 2,
    type: "task",
    title: "New Task Assigned",
    message: "You have been assigned to 'Electrical panel installation' for CSA Makati Building",
    project: "Colegio San Agustin Makati 4-Storey Building",
    timestamp: "2024-01-16T08:15:00Z",
    read: false,
    priority: "medium",
    actionRequired: true,
    assignedTo: "Maria Santos",
  },
  {
    id: 3,
    type: "safety",
    title: "Safety Inspection Required",
    message: "Monthly safety inspection is due for Victory Distribution Center",
    project: "Victory Group North Distribution Center 2",
    timestamp: "2024-01-16T07:45:00Z",
    read: true,
    priority: "high",
    actionRequired: true,
    assignedTo: "Ana Garcia",
  },
  {
    id: 4,
    type: "update",
    title: "Project Status Updated",
    message: "Assumption Sports Complex has been marked as completed",
    project: "Assumption School Antipolo Sports Complex",
    timestamp: "2024-01-15T16:20:00Z",
    read: true,
    priority: "low",
    actionRequired: false,
    assignedTo: "System",
  },
  {
    id: 5,
    type: "meeting",
    title: "Upcoming Client Meeting",
    message: "Client meeting scheduled for tomorrow at 10:30 AM for Unitop Mall project",
    project: "Unitop Mall Roxas City",
    timestamp: "2024-01-15T14:30:00Z",
    read: false,
    priority: "medium",
    actionRequired: true,
    assignedTo: "Elena Rodriguez",
  },
  {
    id: 6,
    type: "document",
    title: "Document Approval Required",
    message: "Victory Safety Inspection Report is pending your approval",
    project: "Victory Group North Distribution Center 2",
    timestamp: "2024-01-15T11:15:00Z",
    read: true,
    priority: "medium",
    actionRequired: true,
    assignedTo: "John Doe",
  },
  {
    id: 7,
    type: "system",
    title: "System Maintenance",
    message: "Scheduled system maintenance on January 20, 2024 from 2:00 AM to 4:00 AM PST",
    project: "System",
    timestamp: "2024-01-15T09:00:00Z",
    read: false,
    priority: "low",
    actionRequired: false,
    assignedTo: "All Users",
  },
  {
    id: 8,
    type: "budget",
    title: "Budget Alert",
    message: "CSA Makati project is at 85% of allocated budget",
    project: "Colegio San Agustin Makati 4-Storey Building",
    timestamp: "2024-01-14T13:45:00Z",
    read: true,
    priority: "medium",
    actionRequired: true,
    assignedTo: "Maria Santos",
  },
]

const notificationSettings = [
  { id: "deadlines", label: "Project Deadlines", enabled: true },
  { id: "tasks", label: "Task Assignments", enabled: true },
  { id: "safety", label: "Safety Alerts", enabled: true },
  { id: "meetings", label: "Meeting Reminders", enabled: true },
  { id: "documents", label: "Document Approvals", enabled: true },
  { id: "budget", label: "Budget Alerts", enabled: false },
  { id: "system", label: "System Updates", enabled: false },
]

export function Notifications() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [readFilter, setReadFilter] = useState("all")
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(notificationSettings)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "deadline":
        return <Clock className="h-5 w-5 text-red-500" />
      case "task":
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case "safety":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "update":
        return <Info className="h-5 w-5 text-green-500" />
      case "meeting":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "document":
        return <FileText className="h-5 w-5 text-orange-500" />
      case "system":
        return <Settings className="h-5 w-5 text-gray-500" />
      case "budget":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
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
    return `${diffInDays}d ago`
  }

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || notification.type === typeFilter
    const matchesPriority = priorityFilter === "all" || notification.priority === priorityFilter
    const matchesRead =
      readFilter === "all" ||
      (readFilter === "read" && notification.read) ||
      (readFilter === "unread" && !notification.read)

    return matchesSearch && matchesType && matchesPriority && matchesRead
  })

  const unreadCount = notifications.filter((n) => !n.read).length
  const highPriorityCount = notifications.filter((n) => n.priority === "high" && !n.read).length

  const toggleSetting = (id: string) => {
    setSettings(settings.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)))
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with project activities and important alerts</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <EyeOff className="h-4 w-4 text-orange-600" />
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
                <p className="text-sm text-gray-600">Action Required</p>
                <p className="text-2xl font-bold">{notifications.filter((n) => n.actionRequired && !n.read).length}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
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
            <CardDescription>Configure which notifications you want to receive</CardDescription>
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
            placeholder="Search notifications..."
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
            <SelectItem value="deadline">Deadlines</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="meeting">Meetings</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="system">System</SelectItem>
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
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Latest updates and alerts from your projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors hover:bg-gray-50 ${
                  !notification.read ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                }`}
              >
                <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(notification.priority)} size="sm">
                        {notification.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{getTimeAgo(notification.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {notification.assignedTo}
                      </span>
                      {notification.project !== "System" && (
                        <span className="truncate max-w-xs">{notification.project}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {notification.actionRequired && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                        >
                          Take Action
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <X className="h-4 w-4" />
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
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
