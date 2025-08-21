import { NotificationItem } from './types'

// Add throttling utility
export const createThrottledFunction = <T extends unknown[]>(func: (...args: T) => void, delay: number) => {
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

// Filter notifications based on search term, type, and time
export const filterNotifications = (
  notifications: NotificationItem[],
  searchTerm: string,
  typeFilter: string,
  timeFilter: string
): NotificationItem[] => {
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
}

// Calculate notification statistics
export const calculateNotificationStats = (notifications: NotificationItem[]) => {
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
    recentCount: recent,
    projectCount: new Set(notifications.map(n => n.project_id).filter(Boolean)).size
  }
}

// Get time ago string
export const getTimeAgo = (timestamp: string): string => {
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
