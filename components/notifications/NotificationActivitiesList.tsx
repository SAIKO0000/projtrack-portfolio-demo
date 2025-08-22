"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Activity } from "lucide-react"
import { NotificationItem, SelectionState } from './types'
import { NotificationItemCard } from './NotificationItemCard'

interface NotificationActivitiesListProps {
  filteredNotifications: NotificationItem[]
  selectionState: SelectionState
  onNotificationClickAction: (notification: NotificationItem) => void
  onToggleSelectionAction: (notificationId: string) => void
  onDeleteNotificationAction?: (notificationId: string) => void
}

export function NotificationActivitiesList({ 
  filteredNotifications, 
  selectionState, 
  onNotificationClickAction, 
  onToggleSelectionAction,
  onDeleteNotificationAction
}: NotificationActivitiesListProps) {
  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/50">
      <CardHeader className="pb-0 border-b border-gray-100">
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
      <CardContent className="pt-0.5">
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <NotificationItemCard 
              key={notification.id}
              notification={notification}
              selectionState={selectionState}
              onNotificationClickAction={onNotificationClickAction}
              onToggleSelectionAction={onToggleSelectionAction}
              onDeleteNotificationAction={onDeleteNotificationAction}
            />
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
  )
}
