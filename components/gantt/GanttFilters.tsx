"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus } from "lucide-react"
import { ViewMode } from "./types"
import { TaskFormModal } from "./TaskFormModal"

interface Project {
  id: string
  name: string
}

interface GanttFiltersProps {
  searchTerm: string
  setSearchTermAction: (term: string) => void
  projectFilter: string
  setProjectFilterAction: (filter: string) => void
  statusFilter: string
  setStatusFilterAction: (filter: string) => void
  viewMode: ViewMode
  setViewModeAction: (mode: ViewMode) => void
  projects: Project[]
  onTaskCreatedAction: () => void
}

export function GanttFilters({
  searchTerm,
  setSearchTermAction,
  projectFilter,
  setProjectFilterAction,
  statusFilter,
  setStatusFilterAction,
  viewMode,
  setViewModeAction,
  projects,
  onTaskCreatedAction
}: GanttFiltersProps) {
  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardContent className="pt-3 pb-3 px-3 sm:px-6">
        {/* Mobile Layout - Stacked */}
        <div className="sm:hidden flex flex-col gap-3">
          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tasks, projects, assignees..."
              value={searchTerm}
              onChange={(e) => setSearchTermAction(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-10 text-sm"
            />
          </div>
          
          {/* Status Filter Row - Mobile */}
          <div className="w-full">
            <Select value={statusFilter} onValueChange={setStatusFilterAction}>
              <SelectTrigger className="h-9 bg-white dark:bg-gray-900 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects and Add Task Row - Mobile */}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-1">
              <Select value={projectFilter} onValueChange={setProjectFilterAction}>
                <SelectTrigger className="h-9 bg-white dark:bg-gray-900 text-xs">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Task Button - Mobile */}
            <div className="col-span-1">
              <TaskFormModal 
                onTaskCreated={onTaskCreatedAction} 
                defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
              />
            </div>
          </div>
          
          {/* View Mode Buttons - Mobile */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === "daily" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeAction("daily")}
              className={`h-7 text-xs px-2 whitespace-nowrap flex-1 transition-all duration-200 ${
                viewMode === "daily" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
              }`}
            >
              Daily
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeAction("weekly")}
              className={`h-7 text-xs px-2 whitespace-nowrap flex-1 transition-all duration-200 ${
                viewMode === "weekly" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
              }`}
            >
              Weekly
            </Button>
            <Button
              variant={viewMode === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeAction("monthly")}
              className={`h-7 text-xs px-2 whitespace-nowrap flex-1 transition-all duration-200 ${
                viewMode === "monthly" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
              }`}
            >
              Monthly
            </Button>
            <Button
              variant={viewMode === "full" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeAction("full")}
              className={`h-7 text-xs px-2 whitespace-nowrap flex-1 transition-all duration-200 ${
                viewMode === "full" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
              }`}
            >
              Full
            </Button>
          </div>
        </div>

        {/* Desktop Layout - Single Row */}
        <div className="hidden sm:flex items-center gap-3 lg:gap-4">
          {/* Search Bar - Takes remaining space */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tasks, projects, assignees..."
              value={searchTerm}
              onChange={(e) => setSearchTermAction(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-10 text-sm"
            />
          </div>
          
          {/* Status Dropdown */}
          <Select value={statusFilter} onValueChange={setStatusFilterAction}>
            <SelectTrigger className="h-10 w-32 bg-white dark:bg-gray-900 text-sm whitespace-nowrap">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Projects Dropdown */}
          <Select value={projectFilter} onValueChange={setProjectFilterAction}>
            <SelectTrigger className="h-10 w-36 bg-white dark:bg-gray-900 text-sm whitespace-nowrap">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === "daily" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeAction("daily")}
              className={`h-8 text-xs px-3 whitespace-nowrap transition-all duration-200 ${
                viewMode === "daily" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
              }`}
            >
              Daily
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeAction("weekly")}
              className={`h-8 text-xs px-3 whitespace-nowrap transition-all duration-200 ${
                viewMode === "weekly" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
              }`}
            >
              Weekly
            </Button>
            <Button
              variant={viewMode === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeAction("monthly")}
              className={`h-8 text-xs px-3 whitespace-nowrap transition-all duration-200 ${
                viewMode === "monthly" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
              }`}
            >
              Monthly
            </Button>
            <Button
              variant={viewMode === "full" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeAction("full")}
              className={`h-8 text-xs px-3 whitespace-nowrap transition-all duration-200 ${
                viewMode === "full" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700" 
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-none"
              }`}
            >
              Full Timeline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
