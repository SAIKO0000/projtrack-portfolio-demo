"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { type Task } from "@/lib/supabase"

interface DashboardUpcomingTasksProps {
  upcomingTasks: Array<Task & { 
    project_name?: string
    project_client?: string
    isOverdue?: boolean
    isToday?: boolean
    isTomorrow?: boolean
    urgencyScore?: number
    daysUntilDue?: number
  }>
  getTaskUrgencyBadgePropsAction: (task: Task & { 
    isOverdue?: boolean
    isToday?: boolean
    isTomorrow?: boolean
    priority?: string
    status?: string 
  }) => { className: string; text: string }
  formatTaskDateAction: (dateString: string | null) => string
}

export function DashboardUpcomingTasks({ 
  upcomingTasks, 
  getTaskUrgencyBadgePropsAction, 
  formatTaskDateAction 
}: DashboardUpcomingTasksProps) {
  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/50">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Upcoming Tasks</CardTitle>
        <CardDescription className="text-sm sm:text-base text-gray-600">Tasks requiring attention</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {upcomingTasks.length > 0 ? upcomingTasks.map((task) => {
            const badgeProps = getTaskUrgencyBadgePropsAction(task)
            return (
              <div key={task.id} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50/80 to-white rounded-xl hover:from-blue-50/50 hover:to-blue-50/30 hover:shadow-md transition-all duration-200 border border-gray-100/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-base font-bold text-gray-900 truncate pr-3">{task.title}</h4>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                        {task.status || 'In Progress'}
                      </Badge>
                      <Badge className={badgeProps.className}>{badgeProps.text}</Badge>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 mb-2 font-medium">
                      <span className="text-gray-500">Project:</span> {task.project_name}
                      {task.project_client && <span className="text-gray-500"> • Client: {task.project_client}</span>}
                    </p>
                    
                    {task.priority && (
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center space-x-1">
                          <span className="text-gray-500">Priority:</span>
                          <Badge variant="outline" className={`text-xs px-2 py-1 ${
                            task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                            task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-green-50 text-green-700 border-green-200'
                          }`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        </span>
                        {task.estimated_hours && (
                          <span className="text-gray-600">
                            <span className="text-gray-500">Est:</span> {task.estimated_hours}h
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <span className={`text-sm font-medium flex items-center space-x-1 ${task.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                      <Clock className="h-4 w-4" />
                      <span>{formatTaskDateAction(task.due_date)}</span>
                    </span>
                    {task.daysUntilDue !== undefined && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        task.daysUntilDue < 0 ? 'bg-red-100 text-red-700' :
                        task.daysUntilDue === 0 ? 'bg-orange-100 text-orange-700' :
                        task.daysUntilDue <= 3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.daysUntilDue < 0 ? `${Math.abs(task.daysUntilDue)} days overdue` :
                         task.daysUntilDue === 0 ? 'Due today' :
                         `${task.daysUntilDue} days left`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          }) : (
            <div className="text-center py-8">
              <Clock className="h-8 sm:h-10 w-8 sm:w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-base text-gray-500 font-medium">No upcoming tasks</p>
              <p className="text-sm text-gray-400 mt-1">All tasks are completed or scheduled later</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
