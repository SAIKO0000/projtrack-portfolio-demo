"use client"

import { Button } from "@/components/ui/button"
import { BarChart3, RefreshCw } from "lucide-react"

interface GanttHeaderProps {
  onRefreshAction: () => void
}

export function GanttHeader({ onRefreshAction }: GanttHeaderProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-5 lg:p-7 rounded-xl shadow-lg border border-gray-200/50">
      {/* Header - Desktop layout */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl xl:text-5xl font-bold text-gray-900">Gantt Chart</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">
                Manage project timelines, track progress, and coordinate tasks
              </p>
            </div>
          </div>
          {/* Enhanced Live Updates indicator and Refresh button */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="default"
              onClick={onRefreshAction}
              className="flex items-center gap-2 h-10 px-5 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
            <div className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200/50">
              <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
              <span className="text-sm font-medium text-emerald-700">Live Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header - Mobile layout */}
      <div className="sm:hidden">
        <div className="text-center mb-4">
          <div className="flex items-center gap-3 justify-center mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Gantt Chart</h1>
          </div>
          <p className="text-base text-gray-600 mb-3">Manage project timelines, track progress, and coordinate tasks</p>
          <Button
            variant="outline"
            size="default"
            onClick={onRefreshAction}
            className="flex items-center gap-2 h-10 px-5 mx-auto border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}
