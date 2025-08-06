"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  MoreHorizontal,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  FileText,
  Edit,
  Trash2,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProjects } from "@/lib/hooks/useProjects"
import { useTasks } from "@/lib/hooks/useTasks"
import { useReports } from "@/lib/hooks/useReports"
import { useAuth } from "@/lib/auth"
import { ProjectFormModal } from "@/components/project-form-modal"
import { ReportUploadModal } from "@/components/report-upload-modal"
import { EditProjectModal } from "@/components/edit-project-modal"
import { toast } from "react-hot-toast"
import { Database } from "@/lib/supabase.types"

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectsProps {
  readonly onProjectSelect?: (projectId: string) => void
}

export function Projects({ onProjectSelect }: ProjectsProps) {
  const { projects, loading, fetchProjects, deleteProject } = useProjects()
  const { tasks, loading: tasksLoading } = useTasks()
  const { reports, loading: reportsLoading, updateReport } = useReports()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewingReports, setViewingReports] = useState<{ projectId: string; projectName: string } | null>(null)

  // Get project reports
  const getProjectReports = (projectId: string) => {
    return reports.filter(report => report.project_id === projectId)
  }

  // Get user position
  const userPosition = user?.user_metadata?.position || "Team Member"
  const isAdmin = userPosition === "Project Manager" || userPosition === "Senior Electrical Engineer"

  // Get report status color
  const getReportStatusColor = (status: string | null) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "revision":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleProjectCreated = () => {
    fetchProjects() // Refresh projects list
  }

  // Handle report status update
  const handleUpdateReportStatus = async (reportId: string, status: string) => {
    try {
      await updateReport(reportId, { status })
      toast.success(`Report status updated to ${status}`)
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Failed to update report status")
    }
  }

  // Calculate task-based progress for a project
  const getProjectTaskProgress = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId)
    if (projectTasks.length === 0) return 0
    
    const completedTasks = projectTasks.filter(task => task.status === 'completed')
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }

  // Get task counts for a project
  const getProjectTaskCounts = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId)
    const completedTasks = projectTasks.filter(task => task.status === 'completed')
    return {
      total: projectTasks.length,
      completed: completedTasks.length
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`)) {
      try {
        await deleteProject(projectId)
        toast.success("Project deleted successfully")
        fetchProjects() // Refresh the list
      } catch (error) {
        console.error("Delete error:", error)
        toast.error("Failed to delete project")
      }
    }
  }
  const handleEditProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setEditingProject(project)
    }
  }

  const handleProjectUpdated = () => {
    setEditingProject(null)
    fetchProjects() // Refresh projects list
  }

  const handleReportStatusUpdate = async (reportId: string, status: string) => {
    try {
      await updateReport(reportId, { status })
      toast.success(`Report status updated to ${status}`)
    } catch (error) {
      console.error("Error updating report status:", error)
      toast.error("Failed to update report status")
    }
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800"
    
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-orange-100 text-orange-800"
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "on-hold":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string | null) => {
    if (!status) return <AlertCircle className="h-4 w-4" />
    
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "in-progress":
        return <Play className="h-4 w-4" />
      case "planning":
        return <Clock className="h-4 w-4" />
      case "on-hold":
        return <Pause className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filteredProjects = projects
    .filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // First, sort by status priority (completed projects last)
      const statusPriority = {
        'in-progress': 1,
        'planning': 2,
        'on-hold': 3,
        'completed': 4
      }
      
      const statusA = statusPriority[(a.status || '') as keyof typeof statusPriority] || 5
      const statusB = statusPriority[(b.status || '') as keyof typeof statusPriority] || 5
      
      if (statusA !== statusB) {
        return statusA - statusB
      }
      
      // Then sort by date (most recent first)
      const dateA = new Date(a.end_date || a.start_date || a.created_at || '1970-01-01').getTime()
      const dateB = new Date(b.end_date || b.start_date || b.created_at || '1970-01-01').getTime()
      
      return dateB - dateA // Most recent first
    })

  if (loading || tasksLoading || reportsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage and track all your electrical engineering projects</p>
        </div>
        <ProjectFormModal onProjectCreated={handleProjectCreated} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{projects.filter((p) => p.status === "in-progress").length}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Play className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{projects.filter((p) => p.status === "completed").length}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Hold</p>
                <p className="text-2xl font-bold">{projects.filter((p) => p.status === "on-hold").length}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Pause className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow overflow-hidden w-full min-h-[400px] flex flex-col"
          >            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-2 break-words leading-tight">{project.name}</CardTitle>
                  <CardDescription className="text-sm mb-3 text-gray-600 line-clamp-3">
                    {project.description}
                  </CardDescription>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center min-w-0">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </span>
                    <span className="flex items-center flex-shrink-0">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(project.end_date)}
                    </span>
                  </div>
                </div>
                <div className="flex items-start flex-col gap-2 flex-shrink-0">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1">{project.status?.replace("-", " ") || "Unknown"}</span>
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-grow flex flex-col">
              <div className="space-y-4 flex-grow">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Task Progress</span>
                    <span className="text-sm text-gray-500">
                      {getProjectTaskCounts(project.id).completed}/{getProjectTaskCounts(project.id).total} tasks ({getProjectTaskProgress(project.id)}%)
                    </span>
                  </div>
                  <Progress value={getProjectTaskProgress(project.id)} className="h-2" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Client:</span>
                    <span className="ml-1 font-medium break-words">{project.client}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-1 font-medium capitalize">{project.status?.replace("-", " ") || "Unknown"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="text-xs">
                    {formatDate(project.start_date)} - {formatDate(project.end_date)}
                  </Badge>
                </div>

                {/* Reports Section */}
                {getProjectReports(project.id).length > 0 && (
                  <div className="space-y-3 flex-grow">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Attached Reports ({getProjectReports(project.id).length})
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {getProjectReports(project.id).slice(0, 2).map((report) => (
                        <div key={report.id} className="bg-gray-50 rounded-lg p-3 border">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate flex-1">
                                {report.file_name}
                              </p>
                              <Badge 
                                className={`text-xs ${getReportStatusColor(report.status)} ml-2`}
                                variant="secondary"
                              >
                                {report.status || 'pending'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">{report.category}</p>
                              {report.uploaded_by && (
                                <p className="text-xs text-gray-400">
                                  By: {report.uploaded_by.slice(0, 8)}...
                                </p>
                              )}
                            </div>
                            
                            {/* Status Control Buttons for Admins */}
                            {isAdmin && report.status !== 'approved' && (
                              <div className="flex gap-1 mt-2">
                                {report.status !== 'approved' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                    onClick={() => handleUpdateReportStatus(report.id, 'approved')}
                                  >
                                    ✓
                                  </Button>
                                )}
                                {report.status !== 'revision' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-2 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                                    onClick={() => handleUpdateReportStatus(report.id, 'revision')}
                                  >
                                    ↺
                                  </Button>
                                )}
                                {report.status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-2 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                    onClick={() => handleUpdateReportStatus(report.id, 'rejected')}
                                  >
                                    ✗
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Show "View All" if more than 2 reports */}
                      {getProjectReports(project.id).length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-gray-500 hover:text-gray-700 h-6"
                          onClick={() => setViewingReports({ projectId: project.id, projectName: project.name })}
                        >
                          View All {getProjectReports(project.id).length} Reports →
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons - always at bottom */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 mt-auto">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex-1 sm:flex-none"
                    onClick={() => onProjectSelect?.(project.id)}
                  >
                    View Details
                  </Button>
                  <ReportUploadModal 
                    preselectedProjectId={project.id}
                  >
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <FileText className="h-4 w-4 mr-2" />
                      Attach Report
                    </Button>
                  </ReportUploadModal>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>          <ProjectFormModal onProjectCreated={handleProjectCreated} />
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        onProjectUpdated={handleProjectUpdated}
      />

      {/* Reports Modal */}
      <Dialog open={!!viewingReports} onOpenChange={(open) => !open && setViewingReports(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Project Reports
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {viewingReports && (
                `All reports for ${viewingReports.projectName}`
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {viewingReports && getProjectReports(viewingReports.projectId).map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{report.file_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Category:</span> {report.category}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Uploaded:</span> {new Date(report.uploaded_at || '').toLocaleDateString()}
                    {report.uploaded_by && (
                      <span className="ml-2">
                        • <span className="font-medium">By:</span> {report.uploaded_by.slice(0, 8)}...
                      </span>
                    )}
                  </p>
                  {report.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Description:</span> {report.description}
                    </p>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <Badge className={`${getReportStatusColor(report.status)} mb-2`}>
                    {report.status || 'pending'}
                  </Badge>
                  {isAdmin && report.status === 'pending' && (
                    <div className="flex flex-col space-y-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-6 text-green-600 hover:bg-green-50"
                        onClick={() => handleReportStatusUpdate(report.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-6 text-yellow-600 hover:bg-yellow-50"
                        onClick={() => handleReportStatusUpdate(report.id, 'revision')}
                      >
                        Request Revision
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-6 text-red-600 hover:bg-red-50"
                        onClick={() => handleReportStatusUpdate(report.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {viewingReports && getProjectReports(viewingReports.projectId).length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reports uploaded for this project yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
