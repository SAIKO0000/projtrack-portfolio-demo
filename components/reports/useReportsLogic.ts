import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useReports } from "@/lib/hooks/useReports"
import { useSupabaseQuery } from "@/lib/hooks/useSupabaseQuery"
import { usePersonnel } from "@/lib/hooks/usePersonnel"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"
import { createThrottledFunction } from "./reports-utils"
import { type EnhancedReport, type ReviewerNotesModalState, type DeleteDialogState, type ReportDisplayName } from "./types"

export function useReportsLogic() {
  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingReport, setEditingReport] = useState<EnhancedReport | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [reviewerNotesModal, setReviewerNotesModal] = useState<ReviewerNotesModalState>({
    open: false,
    action: null,
    reportId: '',
    reportName: ''
  })
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    report: null,
    isDeleting: false
  })
  const lastRefreshRef = useRef<number>(0)

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('reviewerNotesModal state changed:', reviewerNotesModal)
  }, [reviewerNotesModal])

  const { reports, loading, fetchReports, downloadReport, deleteReport, updateReport, getReportUrl } = useReports()
  
  // Use centralized TanStack Query hooks
  const supabaseQuery = useSupabaseQuery()
  const { data: projects = [] } = supabaseQuery.useProjectsQuery()
  
  const { personnel } = usePersonnel()
  const { user } = useAuth()

  // Memoize user calculations
  const userPosition = useMemo(() => user?.user_metadata?.position || "Team Member", [user])
  const isAdmin = useMemo(() => 
    ["Project Manager", "Senior Electrical Engineer", "Field Engineer", "Design Engineer"].includes(userPosition),
    [userPosition]
  )

  const currentUserPersonnel = useMemo(() => 
    personnel.find(p => p.email === user?.email),
    [personnel, user?.email]
  )

  // Throttled refresh function
  const throttledRefresh = useMemo(() => 
    createThrottledFunction(async () => {
      const now = Date.now()
      if (now - lastRefreshRef.current < 30000) { // 30 seconds
        toast.success("Data is already up to date")
        return
      }

      try {
        await fetchReports()
        lastRefreshRef.current = now
        toast.success("Reports refreshed successfully")
      } catch (error) {
        console.error('Error refreshing reports:', error)
        toast.error("Failed to refresh reports")
      }
    }, 3000), // 3 second throttle
    [fetchReports]
  )

  const handleRefresh = useCallback(() => {
    throttledRefresh()
  }, [throttledRefresh])

  // Helper function to check if current user is the assigned reviewer for a report
  const isAssignedReviewer = useCallback((report: EnhancedReport) => {
    const reportWithReviewer = report as typeof report & { assigned_reviewer?: string }
    const isReviewer = reportWithReviewer.assigned_reviewer === currentUserPersonnel?.id
    console.log('isAssignedReviewer check:', {
      currentUserEmail: user?.email,
      currentUserPersonnel,
      reportAssignedReviewer: reportWithReviewer.assigned_reviewer,
      isReviewer
    })
    return isReviewer
  }, [currentUserPersonnel, user?.email])

  // Helper function to format report display name as "Title (File Name)" or just file name if no title
  const getReportDisplayName = useCallback((report: EnhancedReport): ReportDisplayName => {
    const reportWithTitle = report as EnhancedReport & { title?: string }
    
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
  }, [])

  // Helper function to get assigned reviewer name
  const getAssignedReviewerName = (report: EnhancedReport): string => {
    const reportWithReviewer = report as typeof report & { assigned_reviewer?: string }
    if (!reportWithReviewer.assigned_reviewer) return 'No reviewer assigned'
    
    const reviewer = personnel.find(p => p.id === reportWithReviewer.assigned_reviewer)
    return reviewer ? reviewer.name : 'Unknown Reviewer'
  }

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleUploadComplete = useCallback(() => {
    fetchReports()
  }, [fetchReports])

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

  const handleShare = async (report: EnhancedReport) => {
    try {
      const shareUrl = getReportUrl(report.file_path)
      
      // Use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: report.file_name,
          text: `Report: ${report.title || report.file_name}`,
          url: shareUrl,
        })
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        // Fallback: copy to clipboard if available
        await navigator.clipboard.writeText(shareUrl)
        toast.success("Share link copied to clipboard!")
      } else {
        // Final fallback: create a temporary input element
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
          toast.success("Share link copied to clipboard!")
        } catch (err) {
          console.error('Fallback copy failed:', err)
          toast.error("Unable to copy link. Please copy manually: " + shareUrl)
        }
        
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error("Share error:", error)
      toast.error("Failed to share file")
    }
  }

  const handleDelete = (report: EnhancedReport) => {
    setDeleteDialog({
      open: true,
      report,
      isDeleting: false
    })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.report) return

    setDeleteDialog(prev => ({ ...prev, isDeleting: true }))
    
    try {
      await deleteReport(deleteDialog.report.id)
      toast.success("Document deleted successfully")
      setDeleteDialog({ open: false, report: null, isDeleting: false })
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete document")
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const handleEdit = (report: EnhancedReport) => {
    setEditingReport(report)
    setIsEditModalOpen(true)
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
    const reportWithTitle = report as EnhancedReport & { title?: string }
    const matchesSearch =
      report.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reportWithTitle.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesProject = projectFilter === "all" || report.projectName === projectFilter
    const matchesCategory = categoryFilter === "all" || report.category === categoryFilter
    const matchesStatus = statusFilter === "all" || report.status === statusFilter

    return matchesSearch && matchesProject && matchesCategory && matchesStatus
  })

  const uniqueProjects = [...new Set([
    ...projects.map((project) => project.name),
    ...enhancedReports.map((report) => report.projectName)
  ])].sort()
  const uniqueCategories = [...new Set([
    "Financial Reports",
    "Progress Reports", 
    "Technical Documentation",
    "Safety Reports",
    "Quality Reports",
    "Other",
    ...enhancedReports.map((report) => report.category).filter(Boolean)
  ])].sort()

  return {
    // State
    searchTerm,
    projectFilter,
    categoryFilter,
    statusFilter,
    editingReport,
    isEditModalOpen,
    reviewerNotesModal,
    deleteDialog,
    loading,
    enhancedReports,
    filteredReports,
    uniqueProjects,
    uniqueCategories,
    isAdmin,
    user,
    projects,

    // Actions
    setSearchTerm,
    setProjectFilter,
    setCategoryFilter,
    setStatusFilter,
    setEditingReport,
    setIsEditModalOpen,
    setReviewerNotesModal,
    setDeleteDialog,
    handleRefresh,
    handleUploadComplete,
    handleReportStatusUpdate,
    handleReviewerNotesSubmit,
    handleView,
    handleDownload,
    handleShare,
    handleDelete,
    confirmDelete,
    handleEdit,

    // Utilities
    isAssignedReviewer,
    getReportDisplayName,
    getAssignedReviewerName,
  }
}
