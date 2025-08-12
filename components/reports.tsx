"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Download,
  Upload,
  FileText,
  File,
  Calendar,
  User,
  Eye,
  Share,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileImage,
  Archive,
  Layers,
  FileType,
  FileCode,
  Video,
  Music,
  Edit,
  X,
  RotateCcw,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReportUploadModal } from "./report-upload-modal"
import { EditReportModal } from "./edit-report-modal"
import { ReviewerNotesModal } from "./reviewer-notes-modal"
import { useReports, type ReportWithUploader } from "@/lib/hooks/useReports"
import { useProjects } from "@/lib/hooks/useProjects"
import { usePersonnel } from "@/lib/hooks/usePersonnel"
import { useAuth } from "@/lib/auth"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"

type EnhancedReport = ReportWithUploader & {
  projectName: string
  file_size_mb: string
  reviewer_notes?: string
}

export function Reports() {
  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingReport, setEditingReport] = useState<EnhancedReport | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
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

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('reviewerNotesModal state changed:', reviewerNotesModal)
  }, [reviewerNotesModal])

  const { reports, loading, fetchReports, downloadReport, deleteReport, updateReport } = useReports()
  const { projects } = useProjects()
  const { personnel } = usePersonnel()
  const { user } = useAuth()

  // Check user position and admin status
  const userPosition = user?.user_metadata?.position || "Team Member"
  const isAdmin = ["Project Manager", "Senior Electrical Engineer", "Field Engineer", "Design Engineer"].includes(userPosition)

  // Helper function to check if current user is the assigned reviewer for a report
  const isAssignedReviewer = (report: EnhancedReport) => {
    const currentUserPersonnel = personnel.find(p => p.email === user?.email)
    const reportWithReviewer = report as typeof report & { assigned_reviewer?: string }
    const isReviewer = reportWithReviewer.assigned_reviewer === currentUserPersonnel?.id
    console.log('isAssignedReviewer check:', {
      currentUserEmail: user?.email,
      currentUserPersonnel,
      reportAssignedReviewer: reportWithReviewer.assigned_reviewer,
      isReviewer
    })
    return isReviewer
  }

  // Helper function to get assigned reviewer name
  const getAssignedReviewerName = (report: EnhancedReport): string => {
    const reportWithReviewer = report as typeof report & { assigned_reviewer?: string }
    if (!reportWithReviewer.assigned_reviewer) return 'No reviewer assigned'
    
    const reviewer = personnel.find(p => p.id === reportWithReviewer.assigned_reviewer)
    return reviewer ? reviewer.name : 'Unknown Reviewer'
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

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleUploadComplete = () => {
    fetchReports()
  }

  // Handle report status updates with validation
  const handleReportStatusUpdate = async (reportId: string, status: string) => {
    console.log('handleReportStatusUpdate called:', { reportId, status })
    try {
      const report = reports.find(r => r.id === reportId) as EnhancedReport | undefined
      console.log('Found report:', report)
      
      // Prevent self-approval
      if (report && report.uploaded_by === user?.id && (status === 'approved' || status === 'revision' || status === 'rejected')) {
        toast.error("You cannot approve, reject, or request revision on your own report")
        return
      }

      // Prevent non-assigned reviewers from approving
      if (report && !isAssignedReviewer(report) && (status === 'approved' || status === 'revision' || status === 'rejected')) {
        toast.error("You are not assigned as the reviewer for this report")
        return
      }

      // Open the reviewer notes modal for actions that need notes
      if (status === 'approved' || status === 'revision' || status === 'rejected') {
        console.log('Opening reviewer notes modal')
        setReviewerNotesModal({
          open: true,
          action: status as 'approved' | 'revision' | 'rejected',
          reportId: reportId,
          reportName: report?.file_name || 'Unknown Report'
        })
        return
      }

      // For other status updates (like pending), update directly
      await updateReport(reportId, { status })
      toast.success(`Report ${status} successfully`)
      fetchReports()
    } catch (error) {
      console.error("Status update error:", error)
      toast.error("Failed to update report status")
    }
  }

  // Handle reviewer notes submission
  const handleReviewerNotesSubmit = async (action: 'approved' | 'revision' | 'rejected', notes: string) => {
    try {
      await updateReport(reviewerNotesModal.reportId, { 
        status: action,
        reviewer_notes: notes 
      })
      toast.success(`Report ${action} successfully`)
      fetchReports()
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

  const handleView = async (report: EnhancedReport) => {
    try {
      const { data } = supabase.storage
        .from('project-reports')
        .getPublicUrl(report.file_path)
      
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank')
        toast.success("Opening file...")
      } else {
        toast.error("Unable to view file")
      }
    } catch (error) {
      console.error("View error:", error)
      toast.error("Failed to view file")
    }
  }

  const handleDownload = async (report: EnhancedReport) => {
    try {
      await downloadReport(report)
      toast.success("Download started")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download file")
    }
  }

  const handleDelete = async (report: EnhancedReport) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteReport(report.id)
        toast.success("Document deleted successfully")
      } catch (error) {
        console.error("Delete error:", error)
        toast.error("Failed to delete document")
      }
    }
  }

  const handleEdit = (report: EnhancedReport) => {
    setEditingReport(report)
    setIsEditModalOpen(true)
  }

  const getFileIcon = (fileType: string | null, fileName?: string) => {
    if (!fileType) return (
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
        <File className="h-10 w-10 text-gray-500" />
      </div>
    )
    
    const type = fileType.toLowerCase()
    
    // Also check file extension from filename as fallback
    const fileExtension = fileName ? fileName.split('.').pop()?.toLowerCase() : null
    
    if (type.includes('pdf')) {
      return (
        <div className="w-16 h-16 rounded-lg bg-red-100 flex items-center justify-center">
          <FileText className="h-10 w-10 text-red-600" />
        </div>
      )
    }
    if (type.includes('word') || type.includes('doc')) {
      return (
        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
          <FileText className="h-10 w-10 text-blue-600" />
        </div>
      )
    }
    if (type.includes('text') || type === 'txt') {
      return (
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
          <FileType className="h-10 w-10 text-gray-600" />
        </div>
      )
    }
    if (type.includes('excel') || type.includes('sheet') || type === 'xlsx' || type === 'xls' || type === 'csv') {
      return (
        <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center">
          <FileSpreadsheet className="h-10 w-10 text-green-600" />
        </div>
      )
    }
    if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(type)) {
      return (
        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
          <FileImage className="h-10 w-10 text-purple-600" />
        </div>
      )
    }
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gz') || 
        ['zip', 'rar', '7z', 'tar', 'gz'].includes(type) || fileExtension === 'zip') {
      return (
        <div className="w-16 h-16 rounded-lg bg-yellow-100 flex items-center justify-center">
          <Archive className="h-10 w-10 text-yellow-600" />
        </div>
      )
    }
    if (['dwg', 'dxf', 'cad'].includes(type)) {
      return (
        <div className="w-16 h-16 rounded-lg bg-cyan-100 flex items-center justify-center">
          <Layers className="h-10 w-10 text-cyan-600" />
        </div>
      )
    }
    if (type.includes('video') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
      return (
        <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center">
          <Video className="h-10 w-10 text-pink-600" />
        </div>
      )
    }
    if (type.includes('audio') || ['mp3', 'wav', 'flac', 'aac'].includes(type)) {
      return (
        <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Music className="h-10 w-10 text-indigo-600" />
        </div>
      )
    }
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c'].includes(type)) {
      return (
        <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center">
          <FileCode className="h-10 w-10 text-orange-600" />
        </div>
      )
    }
    
    return (
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
        <File className="h-10 w-10 text-gray-500" />
      </div>
    )
  }

  const getStatusColor = (status: string = "pending") => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "revision":
        return "bg-orange-100 text-orange-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string = "Progress Report") => {
    switch (category) {
      case "Progress Report":
        return "bg-blue-100 text-blue-800"
      case "Safety Report":
        return "bg-red-100 text-red-800"
      case "Completion Report":
        return "bg-green-100 text-green-800"
      case "Site Photos":
        return "bg-purple-100 text-purple-800"
      case "Technical Drawing":
        return "bg-indigo-100 text-indigo-800"
      case "Material List":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const enhancedReports = reports.map(report => {
    const project = projects.find(p => p.id === report.project_id)
    return {
      ...report,
      projectName: project?.name || "Unknown Project",
      file_size_mb: report.file_size ? `${(report.file_size / (1024 * 1024)).toFixed(1)} MB` : "Unknown"
    }
  })

  const filteredReports = enhancedReports.filter((report) => {
    const matchesSearch =
      report.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = projectFilter === "all" || report.projectName === projectFilter
    const matchesCategory = categoryFilter === "all" || report.category === categoryFilter
    const matchesStatus = statusFilter === "all" || report.status === statusFilter

    return matchesSearch && matchesProject && matchesCategory && matchesStatus
  })

  const uniqueProjects = [...new Set(enhancedReports.map((report) => report.projectName))]
  const uniqueCategories = [...new Set(enhancedReports.map((report) => report.category).filter(Boolean))]

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Documents</h1>
          <p className="text-gray-600">Manage project documents, reports, and files</p>
        </div>
        <div className="flex items-center space-x-3">
          <ReportUploadModal onUploadComplete={handleUploadComplete}>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </ReportUploadModal>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{enhancedReports.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">{enhancedReports.filter((r) => r.status === "pending").length}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{enhancedReports.filter((r) => r.status === "approved").length}</p>
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
                <p className="text-sm text-gray-600">Need Revision</p>
                <p className="text-2xl font-bold">{enhancedReports.filter((r) => r.status === "revision").length}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map((projectName) => (
                <SelectItem key={projectName} value={projectName}>
                  {projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category || ""}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="revision">Revision</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>All project documents and reports</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredReports.map((report, index) => (
                <div
                  key={report.id}
                  className={`flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <div className="flex-shrink-0 self-start sm:self-center">
                    {getFileIcon(report.file_type, report.file_name)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <h3 className="text-sm font-medium text-gray-900 break-words leading-tight">
                        {report.file_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getStatusColor(report.status || "pending")}>
                          {capitalizeWords(report.status) || "Pending"}
                        </Badge>
                        <Badge className={getCategoryColor(report.category || "Other")}>
                          {report.category || "Other"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{report.projectName}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{report.uploader_name || "Unknown"}</span>
                          <span className="text-xs text-gray-400">{report.uploader_position || "Unknown Position"}</span>
                        </div>
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(report.uploaded_at)}
                      </span>
                      <span className="font-medium">{report.file_size_mb}</span>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col lg:flex-row items-start sm:items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleView(report)}
                      className="h-8 px-2 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 group"
                      title="View file"
                    >
                      <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(report)}
                      className="h-8 px-2 hover:bg-orange-100 hover:text-orange-600 transition-all duration-200 group"
                      title="Edit document"
                    >
                      <Edit className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDownload(report)}
                      className="h-8 px-2 hover:bg-green-100 hover:text-green-600 transition-all duration-200 group"
                      title="Download file"
                    >
                      <Download className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-2 hover:bg-purple-100 hover:text-purple-600 transition-all duration-200 group"
                      title="Share file"
                    >
                      <Share className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(report)}
                      className="h-8 px-2 hover:bg-red-100 hover:text-red-600 transition-all duration-200 group"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    </Button>

                    {/* Approval/Rejection Buttons for Admins */}
                    {isAdmin && report.status !== 'approved' && report.uploaded_by !== user?.id && isAssignedReviewer(report) && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleReportStatusUpdate(report.id, 'approved')}
                          className="h-8 px-2 hover:bg-green-100 hover:text-green-600 transition-all duration-200 group"
                          title="Approve report"
                        >
                          <CheckCircle className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleReportStatusUpdate(report.id, 'revision')}
                          className="h-8 px-2 hover:bg-yellow-100 hover:text-yellow-600 transition-all duration-200 group"
                          title="Request revision"
                        >
                          <RotateCcw className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleReportStatusUpdate(report.id, 'rejected')}
                          className="h-8 px-2 hover:bg-red-100 hover:text-red-600 transition-all duration-200 group"
                          title="Reject report"
                        >
                          <X className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Informational Messages */}
                  <div className="mt-2 space-y-1">
                    {/* Show message for admin users viewing their own reports */}
                    {isAdmin && report.uploaded_by === user?.id && report.status !== 'approved' && (
                      <p className="text-xs text-gray-500 italic">Cannot approve your own report</p>
                    )}

                    {/* Show assigned reviewer info for non-assigned reviewers */}
                    {isAdmin && report.uploaded_by !== user?.id && report.status !== 'approved' && !isAssignedReviewer(report) && (
                      <p className="text-xs text-gray-500 italic">Assigned to: {getAssignedReviewerName(report)}</p>
                    )}

                    {/* Show reviewer notes if available */}
                    {report.reviewer_notes && (report.status === 'approved' || report.status === 'revision' || report.status === 'rejected') && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md border">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Reviewer Notes ({capitalizeWords(report.status)}):
                        </p>
                        <p className="text-xs text-gray-600">{report.reviewer_notes}</p>
                      </div>
                    )}

                    {/* Replace Report Button for report owner when report is rejected/revision */}
                    {report.uploaded_by === user?.id && (report.status === 'rejected' || report.status === 'revision') && (
                      <div className="flex gap-1">
                        <ReportUploadModal 
                          preselectedProjectId={projects.find(p => p.name === report.projectName)?.id || ""}
                          replacingReportId={report.id}
                          onUploadComplete={handleUploadComplete}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            Replace Report
                          </Button>
                        </ReportUploadModal>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredReports.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditReportModal
        report={editingReport}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onReportUpdated={handleUploadComplete}
      />

      <ReviewerNotesModal
        open={reviewerNotesModal.open}
        onOpenChange={(open) => setReviewerNotesModal(prev => ({ ...prev, open }))}
        onSubmit={handleReviewerNotesSubmit}
        reportName={reviewerNotesModal.reportName}
        action={reviewerNotesModal.action}
      />
    </div>
  )
}
