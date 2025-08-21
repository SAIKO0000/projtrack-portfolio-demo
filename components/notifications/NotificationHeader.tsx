"use client"

import { Button } from "@/components/ui/button"
import { Bell, RefreshCw, Clock, CheckSquare, Square, Trash2 } from "lucide-react"
import { SelectionState } from './types'

interface NotificationHeaderProps {
  isRefreshing: boolean
  filteredNotificationsLength: number
  selectionState: SelectionState
  onRefreshAction: () => void
  onToggleDeadlinesAction: () => void
  onEnterSelectionModeAction: () => void
  onExitSelectionModeAction: () => void
  onSelectAllNotificationsAction: () => void
  onDeleteSelectedNotificationsAction: () => void
}

export function NotificationHeader({ 
  isRefreshing,
  filteredNotificationsLength,
  selectionState,
  onRefreshAction,
  onToggleDeadlinesAction,
  onEnterSelectionModeAction,
  onExitSelectionModeAction,
  onSelectAllNotificationsAction,
  onDeleteSelectedNotificationsAction
}: NotificationHeaderProps) {
  const { isSelectionMode, selectedNotifications } = selectionState

  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 lg:p-7 rounded-xl shadow-lg border border-gray-200/50">
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-start sm:justify-between gap-4">
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
        <div className="flex items-center space-x-3">
          {isSelectionMode ? (
            <>
              <Button
                variant="outline"
                onClick={onSelectAllNotificationsAction}
                size="default"
                className="h-10 px-5 py-2"
              >
                {selectedNotifications.size === filteredNotificationsLength ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                {selectedNotifications.size === filteredNotificationsLength ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="destructive"
                onClick={onDeleteSelectedNotificationsAction}
                disabled={selectedNotifications.size === 0}
                size="default"
                className="h-10 px-5 py-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedNotifications.size})
              </Button>
              <Button
                variant="ghost"
                onClick={onExitSelectionModeAction}
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
                onClick={onEnterSelectionModeAction}
                disabled={filteredNotificationsLength === 0}
                size="default"
                className="h-10 px-5 py-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select
              </Button>
              <Button 
                variant="outline" 
                onClick={onRefreshAction}
                disabled={isRefreshing}
                size="default"
                className="h-10 px-5 py-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                variant="outline" 
                onClick={onToggleDeadlinesAction}
                size="default"
                className="h-10 px-4 py-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
              >
                <Clock className="h-4 w-4 mr-2" />
                Deadlines
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden text-center">
        <div className="flex items-center gap-3 justify-center mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">Track recent activities and updates</p>
        <div className="flex gap-2 justify-center">
          {isSelectionMode ? (
            <>
              <Button
                variant="outline"
                onClick={onSelectAllNotificationsAction}
                size="default"
                className="h-10 px-4"
              >
                {selectedNotifications.size === filteredNotificationsLength ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                All
              </Button>
              <Button
                variant="destructive"
                onClick={onDeleteSelectedNotificationsAction}
                disabled={selectedNotifications.size === 0}
                size="default"
                className="h-10 px-4"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="ghost"
                onClick={onExitSelectionModeAction}
                size="default"
                className="h-10 px-4"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onEnterSelectionModeAction}
                disabled={filteredNotificationsLength === 0}
                size="default"
                className="h-10 px-4"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select
              </Button>
              <Button 
                variant="outline" 
                onClick={onRefreshAction}
                disabled={isRefreshing}
                size="default"
                className="h-10 px-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <Button 
                variant="outline" 
                onClick={onToggleDeadlinesAction}
                size="default"
                className="h-10 px-4"
              >
                <Clock className="h-4 w-4 mr-2" />
                Deadlines
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
