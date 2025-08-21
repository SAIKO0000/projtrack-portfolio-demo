"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, CheckCircle, Play, AlertTriangle } from "lucide-react"
import { OverallStats } from "./types"

interface GanttStatsProps {
  stats: OverallStats
}

export function GanttStatsCards({ stats }: GanttStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-7">
      <Card className="border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Tasks</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">In timeline</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-600">Finished tasks</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">In Progress</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-sm text-gray-600">Active work</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Play className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delayed</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.delayed}</p>
              <p className="text-sm text-gray-600">Need attention</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
