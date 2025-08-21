"use client"

import { Users } from "lucide-react"

export function TeamHeader() {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 lg:p-7 rounded-xl shadow-lg border border-gray-200/50">
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl xl:text-5xl font-bold text-gray-900">Team</h1>
              <p className="text-base lg:text-lg text-gray-600 mt-1">Manage your electrical engineering team and workload</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden text-center">
        <div className="flex items-center gap-3 justify-center mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team</h1>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">Manage your electrical engineering team and workload</p>
      </div>
    </div>
  )
}
