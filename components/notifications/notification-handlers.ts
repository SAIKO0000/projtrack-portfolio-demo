"use client"

import { toast } from "@/lib/toast-manager"
import { NotificationItem } from './types'

// Handle notification navigation based on type
export const handleNotificationNavigation = (
  notification: NotificationItem,
  onTabChangeAction?: (tab: string) => void
) => {
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
