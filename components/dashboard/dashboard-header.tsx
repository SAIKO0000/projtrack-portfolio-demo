"use client"

import { TrendingUp } from "lucide-react"
import { ProjectFormModal } from "@/components/project-form-modal"

interface DashboardHeaderProps {
  onProjectCreatedAction: () => void
}

export function DashboardHeader({ onProjectCreatedAction }: DashboardHeaderProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 2xl:p-8 rounded-xl shadow-lg border border-gray-200/50">
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-base lg:text-lg xl:text-xl text-gray-600 mt-1">Welcome! Stay updated with reports and tasks</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ProjectFormModal onProjectCreated={onProjectCreatedAction} />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden text-center">
        <div className="flex items-center gap-3 justify-center mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">Welcome! Stay updated with reports and tasks</p>
        <div className="flex justify-center gap-2">
          <ProjectFormModal onProjectCreated={onProjectCreatedAction} />
        </div>
      </div>
    </div>
  )
}
