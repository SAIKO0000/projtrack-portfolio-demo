"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Activity, Clock, AlertTriangle, Users } from "lucide-react"
import { NotificationStats } from './types'

interface NotificationStatsCardsProps {
  stats: NotificationStats
}

export function NotificationStatsCards({ stats }: NotificationStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
      <Card className="border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Activities</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalCount}</p>
              <p className="text-sm text-gray-600">All notifications</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Last 24 Hours</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.recentCount}</p>
              <p className="text-sm text-gray-600">Recent activity</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Task Activities</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.taskCount}</p>
              <p className="text-sm text-gray-600">Task updates</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Projects Active</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.projectCount}</p>
              <p className="text-sm text-gray-600">With notifications</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
