"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const handleProjectCreated = () => {
    fetchProjects() // Refresh projects list
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

  if (loading || tasksLoading) {
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
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-full">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow overflow-hidden max-w-full"
          >            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 max-w-[calc(100%-12rem)] overflow-hidden">
                  <CardTitle className="text-lg mb-2 break-words">{project.name}</CardTitle><CardDescription className="text-sm mb-3 text-gray-600 line-clamp-2 break-all max-w-full">
                    {project.description}
                  </CardDescription>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{project.location}</span>
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(project.end_date)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
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
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Task Progress</span>
                    <span className="text-sm text-gray-500">
                      {getProjectTaskCounts(project.id).completed}/{getProjectTaskCounts(project.id).total} tasks ({getProjectTaskProgress(project.id)}%)
                    </span>
                  </div>
                  <Progress value={getProjectTaskProgress(project.id)} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Client:</span>
                    <span className="ml-1 font-medium">{project.client}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-1 font-medium capitalize">{project.status?.replace("-", " ") || "Unknown"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {formatDate(project.start_date)} - {formatDate(project.end_date)}
                    </Badge>
                  </div>
                </div>                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    onClick={() => onProjectSelect?.(project.id)}
                  >
                    View Details
                  </Button>                  <ReportUploadModal 
                    preselectedProjectId={project.id}
                  >
                    <Button variant="outline" size="sm">
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
    </div>
  )
}
