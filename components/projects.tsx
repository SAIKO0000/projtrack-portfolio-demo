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
  User,
  RefreshCw,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProjects } from "@/lib/hooks/useProjects"
import { useTasks } from "@/lib/hooks/useTasks"
import { useReports, type ReportWithUploader } from "@/lib/hooks/useReports"
import { usePersonnel } from "@/lib/hooks/usePersonnel"
import { useAuth } from "@/lib/auth"
import { ProjectFormModal } from "@/components/project-form-modal"
import { ReportUploadModal } from "@/components/report-upload-modal"
import { EditProjectModal } from "@/components/edit-project-modal"
import { ReviewerNotesModal } from "@/components/reviewer-notes-modal"
import { SimpleNotesModal } from "@/components/simple-notes-modal"
import { DocumentViewerWithNotesModal } from "@/components/document-viewer-with-notes-modal"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"

type Project = {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  location?: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  team_size?: number
}

interface ProjectsProps {
  readonly onProjectSelect?: (projectId: string) => void
}

export function Projects({ onProjectSelect }: ProjectsProps) {
  const { projects, loading, fetchProjects, deleteProject, updateProject } = useProjects()
  const { tasks, loading: tasksLoading } = useTasks()
  const { reports, loading: reportsLoading, updateReport, fetchReports } = useReports()
  const { personnel } = usePersonnel()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewingReports, setViewingReports] = useState<{ 
    projectId: string; 
    projectName: string; 
    highlightReportId?: string 
  } | null>(null)
  const [reviewerNotesModal, setReviewerNotesModal] = useState<{
    open: boolean
    action: 'approved' | 'revision' | 'rejected' | null
    reportId: string
    reportName: string
  }>({
    open: false,
    action: null,
    reportId: '',
    reportName: ''
  })
  const [simpleNotesModal, setSimpleNotesModal] = useState<{
    open: boolean
    reportId: string
    reportName: string
    existingNotes: string
  }>({
    open: false,
    reportId: '',
    reportName: '',
    existingNotes: ''
  })

  // New state for document viewer with notes
  const [documentViewerModal, setDocumentViewerModal] = useState<{
    open: boolean
    report: ReportWithUploader | null
  }>({
    open: false,
    report: null
  })

  // Get project reports
  const getProjectReports = (projectId: string) => {
    return reports.filter(report => report.project_id === projectId)
  }

  // Get user position
  const userPosition = user?.user_metadata?.position || "Team Member"
  const isAdmin = ["Project Manager", "Senior Electrical Engineer", "Field Engineer", "Design Engineer"].includes(userPosition)
  
  console.log('User admin check:', { userPosition, isAdmin, email: user?.email })

  // Helper function to check if current user is the assigned reviewer for a report
  const isAssignedReviewer = (report: typeof reports[0]) => {
    const currentUserPersonnel = personnel.find(p => p.email === user?.email)
    
    // Check if user is the assigned reviewer
    const reportWithReviewer = report as typeof report & { assigned_reviewer?: string }
    
    const isReviewer = reportWithReviewer.assigned_reviewer === currentUserPersonnel?.id
    
    console.log('Assigned reviewer check:', { 
      reportId: report.id,
      currentUserEmail: user?.email,
      currentUserPersonnelId: currentUserPersonnel?.id,
      assignedReviewer: reportWithReviewer.assigned_reviewer,
      isAssigned: isReviewer
    })
    return isReviewer
  }

  // Get reports assigned to current user for review (supports both single and multiple reviewer systems)
  const getAssignedReportsForCurrentUser = () => {
    const currentUserPersonnel = personnel.find(p => p.email === user?.email)
    if (!currentUserPersonnel) return []

    return reports.filter(report => {
      if (report.status !== 'pending') return false

      // Check single reviewer system (legacy)
      const reportWithReviewer = report as typeof report & { assigned_reviewer?: string }
      if (reportWithReviewer.assigned_reviewer === currentUserPersonnel.id) {
        return true
      }

      // Check multiple reviewer system
      const reportWithReviewers = report as typeof report & { 
        report_reviewers?: Array<{
          reviewer_id: string
          status: string | null
        }>
      }
      
      if (reportWithReviewers.report_reviewers?.some(rr => 
        rr.reviewer_id === currentUserPersonnel.id && rr.status === 'pending'
      )) {
        return true
      }

      return false
    })
  }

  // Helper function to get uploader name and position
  const getUploaderInfo = (report: typeof reports[0]): { name: string; position: string } => {
    const reportWithInfo = report as typeof report & { uploader_name?: string; uploader_position?: string }
    return {
      name: reportWithInfo.uploader_name || (report.uploaded_by ? `${report.uploaded_by.slice(0, 10)}...` : 'Unknown'),
      position: reportWithInfo.uploader_position || 'Unknown Position'
    }
  }

  // Helper function to get assigned reviewer names (multiple reviewers)
  const getAssignedReviewerNames = (report: typeof reports[0]): string => {
    const reportWithReviewer = report as typeof report & { assigned_reviewer?: string }
    
    if (!reportWithReviewer.assigned_reviewer) {
      return 'No reviewer assigned'
    }
    
    // Find the reviewer by ID in personnel list
    const reviewer = personnel.find(p => p.id === reportWithReviewer.assigned_reviewer)
    
    return reviewer?.name || 'Unknown Reviewer'
  }

  // Helper function to get individual reviewer status for display
  const getReviewerStatus = (report: typeof reports[0]) => {
    const reportWithReviewers = report as typeof report & { 
      report_reviewers?: Array<{
        reviewer_id: string
        status: string | null
        personnel: { id: string; name: string; position: string | null } | null
      }>
    }
    
    if (!reportWithReviewers.report_reviewers || reportWithReviewers.report_reviewers.length === 0) {
      return []
    }
    
    return reportWithReviewers.report_reviewers.map(rr => ({
      reviewerId: rr.reviewer_id,
      reviewerName: rr.personnel?.name || 'Unknown',
      reviewerPosition: rr.personnel?.position || 'Unknown Position',
      status: rr.status || 'pending'
    }))
  }

  // Helper function to format report display name as "Title (File Name)" or just file name if no title
  const getReportDisplayName = (report: typeof reports[0]): { title: string; fileName: string; hasTitle: boolean } => {
    const reportWithTitle = report as typeof report & { title?: string }
    
    if (reportWithTitle.title?.trim()) {
      return {
        title: reportWithTitle.title,
        fileName: report.file_name,
        hasTitle: true
      }
    }
    
    return {
      title: report.file_name,
      fileName: '',
      hasTitle: false
    }
  }

  // Capitalize first letter of each word for formal display
  const capitalizeWords = (text: string | null | undefined): string => {
    if (!text) return "Unknown"
    return text
      .replace(/-/g, " ") // Replace hyphens with spaces
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

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

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchProjects(),
        fetchReports()
      ])
      toast.success("Projects refreshed successfully")
    } catch (error) {
      console.error('Error refreshing projects:', error)
      toast.error("Failed to refresh projects")
    }
  }

  // Get unique categories (using priority as categories for now)
  const uniqueCategories = Array.from(new Set(projects.map(p => p.priority).filter(Boolean)))

  // Get unique project names for filtering
  const uniqueProjects = projects.map(p => ({ id: p.id, name: p.name }))

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

  // Handle project status update
  const handleStatusUpdate = async (projectId: string, newStatus: string) => {
    try {
      await updateProject(projectId, { status: newStatus })
      toast.success("Project status updated successfully")
    } catch (error) {
      console.error("Status update error:", error)
      toast.error("Failed to update project status")
    }
  }

  // Handle reviewer notes submission
  const handleReviewerNotesSubmit = async (action: 'approved' | 'revision' | 'rejected', notes: string) => {
    try {
      console.log('Submitting reviewer notes:', { reportId: reviewerNotesModal.reportId, action, notes })
      
      await updateReport(reviewerNotesModal.reportId, { 
        status: action,
        reviewer_notes: notes 
      })
      
      console.log('Report updated successfully')
      toast.success(`Report ${action} successfully`)
      fetchReports() // Refresh reports to get updated data
      setReviewerNotesModal({
        open: false,
        action: null,
        reportId: '',
        reportName: ''
      })
    } catch (error) {
      console.error("Status update error:", error)
      toast.error("Failed to update report status")
    }
  }

  // Handle simple notes submission (without status change)
  const handleSimpleNotesSubmit = async (notes: string) => {
    try {
      await updateReport(simpleNotesModal.reportId, { 
        reviewer_notes: notes 
      })
      
      toast.success('Notes saved successfully')
      fetchReports() // Refresh reports to get updated data
      setSimpleNotesModal({
        open: false,
        reportId: '',
        reportName: '',
        existingNotes: ''
      })
    } catch (error) {
      console.error("Notes update error:", error)
      toast.error("Failed to save notes")
    }
  }

  // Handler for document viewer with notes (both save notes and status changes)
  const handleDocumentViewerNotesSubmit = async (reportId: string, notes: string) => {
    try {
      await updateReport(reportId, { reviewer_notes: notes })
      await fetchReports()
    } catch {
      throw new Error('Failed to save notes')
    }
  }

  const handleDocumentViewerStatusChange = async (reportId: string, status: 'approved' | 'rejected' | 'revision', notes: string) => {
    try {
      await updateReport(reportId, { status, reviewer_notes: notes })
      await fetchReports()
    } catch {
      throw new Error(`Failed to ${status} report`)
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
      const matchesCategory = categoryFilter === "all" || (project.priority && project.priority === categoryFilter)
      const matchesProject = projectFilter === "all" || project.id === projectFilter
      
      return matchesSearch && matchesStatus && matchesCategory && matchesProject
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
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 overflow-y-auto h-full max-w-full">
      {/* Header - Desktop layout */}
      <div className="hidden sm:flex sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and track all your electrical engineering projects</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <ProjectFormModal onProjectCreated={handleProjectCreated} />
        </div>
      </div>

      {/* Header - Mobile layout */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-600">Manage and track all your electrical engineering projects</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Mobile Filters Row 1 - Search and New Project */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <ProjectFormModal onProjectCreated={handleProjectCreated} />
        </div>
        
        {/* Mobile Filters Row 2 - Categories and Status */}
        <div className="grid grid-cols-2 gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In-Progress</SelectItem>
              <SelectItem value="on-hold">On-Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Filters */}
      <div className="hidden sm:block">
        {/* Filters Row 1 - Search and All Projects */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects or clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {uniqueProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters Row 2 - Categories and Status */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="w-full sm:w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In-Progress</SelectItem>
              <SelectItem value="on-hold">On-Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Projects</p>
                <p className="text-lg sm:text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">In-Progress</p>
                <p className="text-lg sm:text-2xl font-bold">{projects.filter((p) => p.status === "in-progress").length}</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Play className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Completed</p>
                <p className="text-lg sm:text-2xl font-bold">{projects.filter((p) => p.status === "completed").length}</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">On-Hold</p>
                <p className="text-lg sm:text-2xl font-bold">{projects.filter((p) => p.status === "on-hold").length}</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Pause className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Assigned for Review - Notification Section */}
      {getAssignedReportsForCurrentUser().length > 0 && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-800">
                Reports Assigned for Review ({getAssignedReportsForCurrentUser().length})
              </CardTitle>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              You have {getAssignedReportsForCurrentUser().length} pending report{getAssignedReportsForCurrentUser().length > 1 ? 's' : ''} to review
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {getAssignedReportsForCurrentUser().map((report) => {
                const reportProject = projects.find(p => p.id === report.project_id)
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-lg p-4 border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => {
                      if (reportProject) {
                        setViewingReports({ 
                          projectId: reportProject.id, 
                          projectName: reportProject.name,
                          highlightReportId: report.id
                        })
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          📋 You are assigned to review this report:
                        </p>
                        <div>
                          <p className="font-semibold text-gray-900 break-words text-lg">
                            {getReportDisplayName(report).title}
                          </p>
                          {getReportDisplayName(report).hasTitle && (
                            <p className="text-xs text-gray-500 mt-1 font-normal">
                              {getReportDisplayName(report).fileName}
                            </p>
                          )}
                        </div>
                        {reportProject && (
                          <p className="text-sm text-gray-600 mt-1">
                            📁 Project: <span className="font-medium">{reportProject.name}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>📅 Uploaded: {formatDate(report.uploaded_at)}</span>
                          <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">
                            Pending Review
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation() // Prevent card click
                          if (reportProject) {
                            setViewingReports({ 
                              projectId: reportProject.id, 
                              projectName: reportProject.name,
                              highlightReportId: report.id
                            })
                          }
                        }}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Review Now
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Projects Grid - Responsive layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow overflow-hidden w-full flex flex-col"
          >
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
                          onClick={() => handleStatusUpdate(project.id, "planning")}
                          className="cursor-pointer"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Planning
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(project.id, "in-progress")}
                          className="cursor-pointer"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          In-Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(project.id, "on-hold")}
                          className="cursor-pointer"
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          On-Hold
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(project.id, "completed")}
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
              <div className="space-y-4 sm:space-y-5 flex-grow">
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">Task Progress</span>
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">
                      {getProjectTaskCounts(project.id).completed}/{getProjectTaskCounts(project.id).total} tasks
                    </span>
                  </div>
                  <Progress value={getProjectTaskProgress(project.id)} className="h-2 sm:h-3" />
                  <p className="text-xs text-gray-500 mt-1 text-center">{getProjectTaskProgress(project.id)}% Complete</p>
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
                {getProjectReports(project.id).length > 0 && (
                  <div className="space-y-2 sm:space-y-3 flex-grow flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-gray-600 hover:text-gray-800 border-gray-300"
                      onClick={() => setViewingReports({ projectId: project.id, projectName: project.name })}
                    >
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      View All {getProjectReports(project.id).length} Reports →
                    </Button>
                  </div>
                )}

                {/* Action buttons - always at bottom */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 mt-auto border-t border-gray-100">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-8 px-3 text-xs"
                    onClick={() => onProjectSelect?.(project.id)}
                  >
                    View Schedule
                  </Button>
                  <ReportUploadModal 
                    preselectedProjectId={project.id}
                  >
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      <FileText className="h-3 w-3 mr-1" />
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
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          <ProjectFormModal onProjectCreated={handleProjectCreated} />
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal
        project={editingProject}
        open={!!editingProject}
        onOpenChangeAction={(open) => !open && setEditingProject(null)}
        onProjectUpdatedAction={handleProjectUpdated}
      />

      {/* Reports Modal */}
      <Dialog open={!!viewingReports} onOpenChange={(open) => !open && setViewingReports(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Project Reports
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {viewingReports && (
                `All reports for ${viewingReports.projectName}`
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {viewingReports && getProjectReports(viewingReports.projectId).map((report) => {
              const isHighlighted = viewingReports.highlightReportId === report.id
              const isAssigned = isAssignedReviewer(report)
              
              return (
                <div 
                  key={report.id} 
                  className={`p-3 rounded-lg border transition-colors ${
                    isHighlighted 
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                      : isAssigned && report.status === 'pending'
                        ? 'bg-yellow-50 border-yellow-300' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isHighlighted && (
                    <div className="mb-2 flex items-center text-blue-700 text-sm font-medium">
                      <FileText className="h-4 w-4 mr-1" />
                      ⭐ This is the report you need to review
                    </div>
                  )}
                  {isAssigned && report.status === 'pending' && !isHighlighted && (
                    <div className="mb-2 flex items-center text-yellow-700 text-sm font-medium">
                      <FileText className="h-4 w-4 mr-1" />
                      📋 Assigned to you for review
                    </div>
                  )}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div>
                      <h4 className="font-medium truncate text-gray-900">
                        {getReportDisplayName(report).title}
                      </h4>
                      {getReportDisplayName(report).hasTitle && (
                        <p className="text-xs text-gray-500 font-normal truncate">
                          {getReportDisplayName(report).fileName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                      <span><span className="font-medium">Category:</span> {report.category}</span>
                      <span><span className="font-medium">Uploaded:</span> {new Date(report.uploaded_at || '').toLocaleDateString()}</span>
                      {report.uploaded_by && (
                        <span>
                          <span className="font-medium">By:</span> {getUploaderInfo(report).name}
                          <span className="ml-1 text-gray-500">({getUploaderInfo(report).position})</span>
                        </span>
                      )}
                    </div>
                    {report.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Description:</span> {report.description}
                      </p>
                    )}
                  </div>
                  <Badge className={`${getReportStatusColor(report.status)} ml-4 flex-shrink-0`}>
                    {capitalizeWords(report.status) || 'Pending'}
                  </Badge>
                </div>

                {/* Action buttons in horizontal layout */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {/* Download button for all users */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 px-2 text-gray-600 hover:bg-gray-50 border-gray-200"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.storage
                          .from('project-reports')
                          .download(report.file_path)

                        if (error) throw error

                        const url = URL.createObjectURL(data)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = report.file_name
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                        toast.success('File downloaded successfully')
                      } catch (error) {
                        console.error('Download error:', error)
                        toast.error('Failed to download file')
                      }
                    }}
                  >
                    Download
                  </Button>

                  {/* View & Note button for assigned reviewers */}
                  {isAdmin && isAssignedReviewer(report) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7 px-2 text-purple-600 hover:bg-purple-50 border-purple-200"
                      onClick={() => {
                        setDocumentViewerModal({
                          open: true,
                          report: report
                        })
                      }}
                    >
                      View & Note
                    </Button>
                  )}

                  {/* Approval buttons for pending reports */}
                  {isAdmin && report.status === 'pending' && report.uploaded_by !== user?.id && isAssignedReviewer(report) && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 px-2 text-green-600 hover:bg-green-50 border-green-200"
                        onClick={() => {
                          setReviewerNotesModal({
                            open: true,
                            action: 'approved',
                            reportId: report.id,
                            reportName: report.file_name || 'Unknown Report'
                          })
                        }}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 px-2 text-yellow-600 hover:bg-yellow-50 border-yellow-200"
                        onClick={() => {
                          setReviewerNotesModal({
                            open: true,
                            action: 'revision',
                            reportId: report.id,
                            reportName: report.file_name || 'Unknown Report'
                          })
                        }}
                      >
                        Revision
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 px-2 text-red-600 hover:bg-red-50 border-red-200"
                        onClick={() => {
                          setReviewerNotesModal({
                            open: true,
                            action: 'rejected',
                            reportId: report.id,
                            reportName: report.file_name || 'Unknown Report'
                          })
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {/* Replace Report Button for report owner when report is rejected/revision */}
                  {report.uploaded_by === user?.id && (report.status === 'rejected' || report.status === 'revision') && (
                    <ReportUploadModal 
                      preselectedProjectId={viewingReports.projectId}
                      replacingReportId={report.id}
                      onUploadComplete={() => {
                        fetchProjects()
                        setViewingReports(null)
                      }}
                    >
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 px-2 text-blue-600 hover:bg-blue-50 border-blue-200"
                      >
                        Replace Report
                      </Button>
                    </ReportUploadModal>
                  )}
                </div>

                {/* Show reviewer notes if available */}
                {(() => {
                  const reportWithNotes = report as typeof report & { reviewer_notes?: string }
                  return reportWithNotes.reviewer_notes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-800 mb-1">
                        Reviewer Notes:
                      </p>
                      <p className="text-xs text-blue-700">{reportWithNotes.reviewer_notes}</p>
                    </div>
                  )
                })()}

                {/* Show multiple reviewers status */}
                {(() => {
                  const reviewers = getReviewerStatus(report)
                  return reviewers.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                      <p className="text-xs font-medium text-gray-800 mb-1">
                        Reviewers ({reviewers.length}):
                      </p>
                      <div className="space-y-1">
                        {reviewers.map((reviewer) => (
                          <div key={reviewer.reviewerId} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">
                              {reviewer.reviewerName} - {reviewer.reviewerPosition}
                            </span>
                            <Badge 
                              className={`ml-2 ${
                                reviewer.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                reviewer.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                reviewer.status === 'revision' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                              variant="outline"
                            >
                              {capitalizeWords(reviewer.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Status messages */}
                {isAdmin && report.uploaded_by === user?.id && report.status === 'pending' && (
                  <p className="text-xs text-gray-500 italic mt-2">Cannot approve your own report</p>
                )}
                {isAdmin && report.uploaded_by !== user?.id && report.status === 'pending' && !isAssignedReviewer(report) && (
                  <p className="text-xs text-gray-500 italic mt-2">Assigned to: {getAssignedReviewerNames(report)}</p>
                )}
              </div>
              )
            })}
            
            {viewingReports && getProjectReports(viewingReports.projectId).length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-500">No reports have been uploaded for this project yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReviewerNotesModal
        open={reviewerNotesModal.open}
        onOpenChangeAction={(open) => setReviewerNotesModal(prev => ({ ...prev, open }))}
        onSubmitAction={handleReviewerNotesSubmit}
        reportName={reviewerNotesModal.reportName}
        action={reviewerNotesModal.action}
      />

      <SimpleNotesModal
        open={simpleNotesModal.open}
        onOpenChange={(open) => setSimpleNotesModal(prev => ({ ...prev, open }))}
        onSubmit={handleSimpleNotesSubmit}
        reportName={simpleNotesModal.reportName}
        existingNotes={simpleNotesModal.existingNotes}
      />

      <DocumentViewerWithNotesModal
        open={documentViewerModal.open}
        onOpenChangeAction={(open) => setDocumentViewerModal(prev => ({ ...prev, open }))}
        report={documentViewerModal.report}
        onNotesSubmitAction={handleDocumentViewerNotesSubmit}
        onStatusChangeAction={handleDocumentViewerStatusChange}
        userRole={isAdmin && documentViewerModal.report && isAssignedReviewer(documentViewerModal.report) ? 'reviewer' : 'viewer'}
      />
    </div>
  )
}