"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Briefcase } from "lucide-react"
import { TeamStats } from "./types"

type TeamStatsCardsProps = {
  stats: TeamStats
}

export function TeamStatsCards({ stats }: TeamStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-7">
      <Card className="border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-gray-700 uppercase tracking-wide">Total Members</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
              <p className="text-sm text-gray-600">Active team members</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-gray-700 uppercase tracking-wide">Active Projects</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
              <p className="text-sm text-gray-600">Currently running</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
