"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FolderOpen, AlertTriangle, Users } from "lucide-react"

interface DashboardStatsCardsProps {
  stats: {
    activeProjects: number
    overdueTasks: number
    totalPersonnel: number
  }
  projectAnalytics: {
    total: number
  }
}

export function DashboardStatsCards({ stats, projectAnalytics }: DashboardStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7 2xl:gap-8">
      <Card className="border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Projects</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{projectAnalytics.total}</p>
              <p className="text-xs sm:text-sm text-gray-600">All active projects</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Active Projects</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
              <p className="text-xs sm:text-sm text-gray-600">Currently in progress</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Overdue Tasks</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.overdueTasks}</p>
              <p className="text-xs sm:text-sm text-gray-600">Need attention</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Team Members</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.totalPersonnel}</p>
              <p className="text-xs sm:text-sm text-gray-600">Active personnel</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
