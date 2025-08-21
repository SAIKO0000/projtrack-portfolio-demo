"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { NotificationFilters } from './types'

interface NotificationFiltersBarProps {
  filters: NotificationFilters
  onSearchChangeAction: (search: string) => void
  onTypeFilterChangeAction: (type: string) => void
  onTimeFilterChangeAction: (time: string) => void
}

export function NotificationFiltersBar({ 
  filters, 
  onSearchChangeAction, 
  onTypeFilterChangeAction, 
  onTimeFilterChangeAction 
}: NotificationFiltersBarProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200/50">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search activities..."
            value={filters.searchTerm}
            onChange={(e) => onSearchChangeAction(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Select value={filters.typeFilter} onValueChange={onTypeFilterChangeAction}>
            <SelectTrigger className="w-full sm:w-36 h-10">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="photo">Photos</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="event">Events</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.timeFilter} onValueChange={onTimeFilterChangeAction}>
            <SelectTrigger className="w-full sm:w-32 h-10">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
