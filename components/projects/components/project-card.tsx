import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  MoreHorizontal,
  Calendar,
  MapPin,
  User,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  Play,
  Clock,
  Pause,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { type Project } from "../types/project-types"
import { useCapitalizeWords, useGetStatusColor, useFormatDate, useGetStatusIcon } from "../utils"

interface ProjectCardProps {
  project: Project
  isAdmin: boolean
  taskProgress: number
  taskCounts: { total: number; completed: number }
  reportsCount: number
  onProjectSelect?: (projectId: string) => void
  onStatusUpdate: (projectId: string, newStatus: string) => void
  onEditProject: (projectId: string) => void
  onDeleteProject: (projectId: string, projectName: string) => void
  onViewReports: (projectId: string, projectName: string) => void
  onReportUploaded?: () => void
  ReportUploadModal: React.ComponentType<{ 
    preselectedProjectId: string
    onUploadComplete?: () => void
    children: React.ReactNode 
  }>
}

export function ProjectCard({
  project,
  isAdmin,
  taskProgress,
  taskCounts,
  reportsCount,
  onProjectSelect,
  onStatusUpdate,
  onEditProject,
  onDeleteProject,
  onViewReports,
  onReportUploaded,
  ReportUploadModal
}: ProjectCardProps) {
  const capitalizeWords = useCapitalizeWords()
  const getStatusColor = useGetStatusColor()
  const formatDate = useFormatDate()
  const getStatusIcon = useGetStatusIcon()

  return (
    <Card className="border-l-4 border-l-orange-500 bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden w-full flex flex-col border border-gray-200/50 shadow-lg hover:scale-[1.02] transform">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl mb-2 break-words leading-tight">{project.name}</CardTitle>
            <CardDescription className="text-xs sm:text-sm mb-2 sm:mb-3 text-gray-600 line-clamp-2">
              {project.description}
            </CardDescription>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
              <span className="flex items-center min-w-0">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{project.location}</span>
              </span>
              <span className="flex items-center flex-shrink-0">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {formatDate(project.end_date)}
              </span>
              {project.team_size && (
                <span className="flex items-center flex-shrink-0">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {project.team_size} {project.team_size === 1 ? 'member' : 'members'}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start flex-col gap-2 flex-shrink-0">
            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge 
                    className={`${getStatusColor(project.status)} cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md select-none text-xs`}
                    title="Click to change status"
                  >
                    {getStatusIcon(project.status)}
                    <span className="ml-1">{capitalizeWords(project.status) || "Unknown"}</span>
                    <span className="ml-1 text-xs opacity-70">▼</span>
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onStatusUpdate(project.id, "planning")}
                    className="cursor-pointer"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Planning
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onStatusUpdate(project.id, "in-progress")}
                    className="cursor-pointer"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    In-Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onStatusUpdate(project.id, "on-hold")}
                    className="cursor-pointer"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    On-Hold
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onStatusUpdate(project.id, "completed")}
                    className="cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge 
                className={`${getStatusColor(project.status)} cursor-default text-xs`}
                title="Status (read-only)"
              >
                {getStatusIcon(project.status)}
                <span className="ml-1">{capitalizeWords(project.status) || "Unknown"}</span>
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditProject(project.id)}>
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteProject(project.id, project.name)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-grow flex flex-col">
        <div className="space-y-4 sm:space-y-5 flex-grow">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-medium text-gray-900">Task Progress</span>
              <span className="text-xs sm:text-sm text-gray-600 font-medium">
                {taskCounts.completed}/{taskCounts.total} tasks
              </span>
            </div>
            <Progress value={taskProgress} className="h-2 sm:h-3" />
            <p className="text-xs text-gray-500 mt-1 text-center">{taskProgress}% Complete</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="space-y-2">
              <div>
                <span className="text-gray-500 block text-xs">Client:</span>
                <span className="font-medium break-words text-xs sm:text-sm">{project.client}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-500 block text-xs">Status:</span>
                <span className="font-medium text-xs sm:text-sm">{capitalizeWords(project.status) || "Unknown"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center py-2">
            <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
              {formatDate(project.start_date)} → {formatDate(project.end_date)}
            </Badge>
          </div>

          {/* View All Reports button - only show if reports exist */}
          {reportsCount > 0 && (
            <div className="space-y-2 sm:space-y-3 flex-grow flex items-center justify-center">
              <Button
                variant="outline"
                size="default"
                className="h-8 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm text-gray-600 hover:text-gray-800 border-gray-300"
                onClick={() => onViewReports(project.id, project.name)}
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                View All {reportsCount} Reports →
              </Button>
            </div>
          )}

          {/* Action buttons - always at bottom */}
          <div className="flex flex-row items-center gap-2 sm:gap-3 pt-3 sm:pt-4 mt-auto border-t border-gray-100">
            <Button
              size="default"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-8 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm flex-1"
              onClick={() => onProjectSelect?.(project.id)}
            >
              View Schedule
            </Button>
            <ReportUploadModal 
              preselectedProjectId={project.id}
              onUploadComplete={onReportUploaded}
            >
              <Button variant="outline" size="default" className="h-8 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm flex-1">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Attach Report
              </Button>
            </ReportUploadModal>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
