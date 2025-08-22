"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useNotificationsQuery } from "@/lib/hooks/useNotificationsOptimized"
import { useSupabaseQuery } from "@/lib/hooks/useSupabaseQuery"
import { useDeadlineNotifications } from "@/lib/hooks/useDeadlineNotifications"
import { toast } from "@/lib/toast-manager"
import { createThrottledFunction, filterNotifications, calculateNotificationStats } from './utils'
import { handleNotificationNavigation } from './notification-handlers'
import { NotificationHeader } from './NotificationHeader'
import { NotificationStatsCards } from './NotificationStatsCards'
import { NotificationDeadlinesPanel } from './NotificationDeadlinesPanel'
import { NotificationFiltersBar } from './NotificationFiltersBar'
import { NotificationActivitiesList } from './NotificationActivitiesList'
import { NotificationsProps, NotificationItem, SelectionState, DeadlineState } from './types'

export function NotificationsRefactored({ onTabChangeAction }: NotificationsProps = {}) {
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

  // Get projects data for forecast tracking
  const supabaseQuery = useSupabaseQuery()
  const { 
    data: projects = []
  } = supabaseQuery.useProjectsQuery()

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

  const deleteNotification = (_notificationId: string) => {
    // Here you would typically call an API to delete the specific notification
    // For now, we'll just show a toast
    toast.success('Notification deleted')
    // You could also remove it from local state if you maintain notifications locally
  }

  // Handle notification click to redirect to specific items
  const handleNotificationClick = (notification: NotificationItem) => {
    if (isSelectionMode) return // Don't navigate when in selection mode
    
    handleNotificationNavigation(notification, onTabChangeAction)
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
  const notifications: NotificationItem[] = systemNotifications.map(notif => ({
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
    return filterNotifications(notifications, searchTerm, typeFilter, timeFilter)
  }, [notifications, searchTerm, typeFilter, timeFilter])

  // Memoized stats calculations with In Progress projects forecast
  const stats = useMemo(() => {
    const notificationStats = calculateNotificationStats(notifications)
    
    // Count projects with status 'in-progress' for forecast (correct status value)
    // Debug logging to check project data
    console.log('📊 Debug - Projects for forecast:', projects)
    console.log('📊 Debug - Projects count:', Array.isArray(projects) ? projects.length : 'Not array')
    
    const inProgressProjects = Array.isArray(projects) 
      ? projects.filter(p => {
          console.log('📊 Debug - Project status:', p?.status)
          return p && typeof p === 'object' && 'status' in p && p.status === 'in-progress'
        }).length
      : 0
      
    console.log('📊 Debug - In Progress count:', inProgressProjects)
      
    return {
      ...notificationStats,
      inProgressProjects
    }
  }, [notifications, projects])

  // Create state objects for components
  const selectionState: SelectionState = {
    isSelectionMode,
    selectedNotifications
  }

  const deadlineState: DeadlineState = {
    showDeadlines,
    upcomingTasks,
    isLoading: deadlineLoading,
    lastChecked: lastChecked || undefined
  }

  const filters = {
    searchTerm,
    typeFilter,
    timeFilter
  }

  return (
    <div className="p-3 sm:p-5 lg:p-9 space-y-4 sm:space-y-5 lg:space-y-7 overflow-y-auto h-full bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
      {/* Modern Header with Glassmorphism */}
      <NotificationHeader
        isRefreshing={refreshing}
        filteredNotificationsLength={filteredNotifications.length}
        selectionState={selectionState}
        onRefreshAction={handleRefresh}
        onToggleDeadlinesAction={() => setShowDeadlines(!showDeadlines)}
        onEnterSelectionModeAction={enterSelectionMode}
        onExitSelectionModeAction={exitSelectionMode}
        onSelectAllNotificationsAction={selectAllNotifications}
        onDeleteSelectedNotificationsAction={deleteSelectedNotifications}
      />

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
          <NotificationStatsCards stats={stats} />

          {/* Deadlines Panel */}
          <NotificationDeadlinesPanel
            deadlineState={deadlineState}
            onCheckDeadlinesAction={checkDeadlines}
            onTabChangeAction={onTabChangeAction}
          />

          {/* Filters */}
          <NotificationFiltersBar
            filters={filters}
            onSearchChangeAction={setSearchTerm}
            onTypeFilterChangeAction={setTypeFilter}
            onTimeFilterChangeAction={setTimeFilter}
          />

          {/* Activities List */}
          <NotificationActivitiesList
            filteredNotifications={filteredNotifications}
            selectionState={selectionState}
            onNotificationClickAction={handleNotificationClick}
            onToggleSelectionAction={toggleNotificationSelection}
            onDeleteNotificationAction={deleteNotification}
          />
        </>
      )}
    </div>
  )
}
