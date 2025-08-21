// Notification types and interfaces
export interface NotificationsProps {
  onTabChangeAction?: (tab: string) => void
}

export interface NotificationItem {
  id: string
  type: string
  project_id?: string
  title: string
  message: string
  timestamp: string
  project_name?: string
  priority?: string
  metadata?: Record<string, unknown>
}

export interface NotificationStats {
  totalCount: number
  taskCount: number
  recentCount: number
  projectCount: number
}

export interface NotificationFilters {
  searchTerm: string
  typeFilter: string
  timeFilter: string
}

export interface SelectionState {
  isSelectionMode: boolean
  selectedNotifications: Set<string>
}

export interface DeadlineState {
  showDeadlines: boolean
  upcomingTasks: Array<{
    id: string
    title: string
    project_name: string
    end_date: string
    status: string
    priority: string
    daysRemaining: number
  }>
  isLoading: boolean
  lastChecked?: Date
}
