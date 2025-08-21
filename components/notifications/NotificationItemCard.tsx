"use client"

import { Calendar, Users, CheckSquare, Square } from "lucide-react"
import { NotificationItem, SelectionState } from './types'
import { NotificationIcon } from './NotificationIcon'
import { getTimeAgo } from './utils'

interface NotificationItemCardProps {
  notification: NotificationItem
  selectionState: SelectionState
  onNotificationClickAction: (notification: NotificationItem) => void
  onToggleSelectionAction: (notificationId: string) => void
}

export function NotificationItemCard({ 
  notification, 
  selectionState, 
  onNotificationClickAction, 
  onToggleSelectionAction 
}: NotificationItemCardProps) {
  const { isSelectionMode, selectedNotifications } = selectionState

  return (
    <div
      className="relative p-3 sm:p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-blue-300 bg-gradient-to-r from-white to-gray-50/50 border-gray-200 cursor-pointer group touch-manipulation"
      onClick={() => onNotificationClickAction(notification)}
    >
      {isSelectionMode && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelectionAction(notification.id)
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
      
      <div className={`flex h-full ${isSelectionMode ? 'pl-6 sm:pl-8' : ''}`}>
        {/* Icon column - Hide on mobile to save space */}
        <div className="hidden sm:flex flex-shrink-0 mr-3 mt-1">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 group-hover:bg-blue-100 transition-colors w-10 h-10 flex items-center justify-center">
            <NotificationIcon type={notification.type} />
          </div>
        </div>
        
        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Header with timestamp */}
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              {/* Mobile icon inline with title */}
              <div className="flex items-start gap-2 sm:hidden mb-1">
                <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 shrink-0">
                  <NotificationIcon type={notification.type} />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words group-hover:text-blue-700 transition-colors leading-tight">
                  {notification.title}
                </h3>
              </div>
              
              {/* Desktop title */}
              <h3 className="hidden sm:block text-base font-semibold text-gray-900 mb-1 break-words group-hover:text-blue-700 transition-colors">
                {notification.title}
              </h3>
            </div>
            <div className="text-xs text-gray-500 ml-2 sm:ml-3 flex-shrink-0 bg-gray-100 px-1.5 sm:px-2 py-1 rounded-full">
              {getTimeAgo(notification.timestamp)}
            </div>
          </div>

          {/* Message */}
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed break-words">
            {notification.message && notification.message !== notification.title ? 
              notification.message : 
              `New activity detected in ${notification.project_name || 'project'} - Check for updates and progress changes.`}
          </p>

          {/* Footer info with enhanced mobile styling */}
          <div className="flex flex-col space-y-2 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="flex items-center text-gray-600 bg-gray-50 px-2 py-1 sm:px-2 sm:py-1 rounded-lg border text-xs sm:text-sm max-w-full sm:max-w-none">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 text-blue-500 flex-shrink-0" />
                <span className="truncate">{notification.project_name || 'Unknown Project'}</span>
              </span>
              {notification.metadata?.user_name && (
                <span className="flex items-center text-gray-600 bg-orange-50 px-2 py-1 sm:px-2 sm:py-1 rounded-lg border border-orange-200 text-xs sm:text-sm max-w-full sm:max-w-none">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 text-orange-500 flex-shrink-0" />
                  <span className="truncate">{notification.metadata.user_name ? String(notification.metadata.user_name) : 'Unknown User'}</span>
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 italic text-center sm:text-right">
              Tap to view details
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
