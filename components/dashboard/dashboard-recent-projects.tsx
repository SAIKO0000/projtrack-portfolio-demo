    "use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FolderOpen, Clock, Users, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { type Project } from "@/lib/supabase"
import { getStatusColor, formatDate } from "./dashboard-utils"

interface DashboardRecentProjectsProps {
  projects: Project[]
  getProjectTaskProgressAction: (projectId: string) => number
  getProjectTaskCountsAction: (projectId: string) => { total: number; completed: number }
  onEditProjectAction: (projectId: string) => void
  onDeleteProjectAction: (projectId: string, projectName: string) => void
}

export function DashboardRecentProjects({ 
  projects, 
  getProjectTaskProgressAction, 
  getProjectTaskCountsAction, 
  onEditProjectAction, 
  onDeleteProjectAction 
}: DashboardRecentProjectsProps) {
  return (
    <Card className="lg:col-span-2 bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/50">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Recent Projects</CardTitle>
        <CardDescription className="text-sm sm:text-base text-gray-600">Latest project updates and progress</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {projects.slice(0, 4).map((project) => (
            <div
              key={project.id}
              className="relative p-4 rounded-lg border transition-colors hover:bg-gray-50 bg-white border-gray-200 cursor-pointer"
            >
              <div className="flex h-full">
                {/* Icon column */}
                <div className="flex-shrink-0 mr-4 mt-1">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                
                {/* Content column */}
                <div className="flex-1 min-w-0">
                  {/* Header with status */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 mb-1 break-words">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 font-medium">{project.client}</p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <Badge className={`${getStatusColor(project.status || 'unknown')} text-sm flex-shrink-0 font-medium px-3 py-1`}>
                        {(project.status || 'unknown').replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200/50">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                          <DropdownMenuItem onClick={() => onEditProjectAction(project.id)} className="text-sm p-2">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteProjectAction(project.id, project.name)}
                            className="text-red-600 focus:text-red-600 text-sm p-2"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <Progress value={getProjectTaskProgressAction(project.id)} className="h-2" />
                    <span className="text-sm text-gray-600 mt-1 block font-medium">
                      {getProjectTaskCountsAction(project.id).completed}/{getProjectTaskCountsAction(project.id).total} tasks ({getProjectTaskProgressAction(project.id)}%)
                    </span>
                  </div>

                  {/* Footer info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 space-y-1 sm:space-y-0">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      {formatDate(project.start_date)} - {formatDate(project.end_date)}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {project.team_size || 1} members
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
