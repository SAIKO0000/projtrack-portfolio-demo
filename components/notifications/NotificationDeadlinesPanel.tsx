"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, RefreshCw, CheckCircle } from "lucide-react"
import { DeadlineState } from './types'

interface NotificationDeadlinesPanelProps {
  deadlineState: DeadlineState
  onCheckDeadlinesAction: () => void
  onTabChangeAction?: (tab: string) => void
}

export function NotificationDeadlinesPanel({ 
  deadlineState, 
  onCheckDeadlinesAction, 
  onTabChangeAction 
}: NotificationDeadlinesPanelProps) {
  const { showDeadlines, upcomingTasks, isLoading, lastChecked } = deadlineState

  if (!showDeadlines) return null

  return (
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
              {isLoading ? 'Checking deadlines...' : 
               lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 
               'Not yet checked'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {upcomingTasks.length} tasks with deadlines in next 7 days
            </p>
          </div>
          <div className="ml-4">
            <Button 
              size="default" 
              variant="outline"
              onClick={onCheckDeadlinesAction}
              disabled={isLoading}
              className="h-12 px-6"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
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
        {upcomingTasks.length === 0 && !isLoading && (
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
  )
}
