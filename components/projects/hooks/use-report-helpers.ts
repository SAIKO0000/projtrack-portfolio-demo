import { useCallback } from "react"
import { usePersonnel } from "@/lib/hooks/usePersonnel"
import { useReportsOptimized } from "@/lib/hooks/useReportsOptimized"

export const useReportHelpers = () => {
  const { personnel } = usePersonnel()
  const { data: reports = [] } = useReportsOptimized()

  // Helper function to get uploader name and position
  const getUploaderInfo = useCallback((report: typeof reports[0]): { name: string; position: string } => {
    const reportWithInfo = report as typeof report & { uploader_name?: string; uploader_position?: string }
    return {
      name: reportWithInfo.uploader_name || (report.uploaded_by ? `${report.uploaded_by.slice(0, 10)}...` : 'Unknown'),
      position: reportWithInfo.uploader_position || 'Unknown Position'
    }
  }, [])

  // Helper function to get assigned reviewer names (multiple reviewers)
  const getAssignedReviewerNames = useCallback((report: typeof reports[0]): string => {
    const reportWithReviewer = report as typeof report & { assigned_reviewer?: string }
    
    if (!reportWithReviewer.assigned_reviewer) {
      return 'No reviewer assigned'
    }
    
    // Find the reviewer by ID in personnel list
    const reviewer = personnel.find(p => p.id === reportWithReviewer.assigned_reviewer)
    
    return reviewer?.name || 'Unknown Reviewer'
  }, [personnel])

  // Helper function to get individual reviewer status for display
  const getReviewerStatus = useCallback((report: typeof reports[0]) => {
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
  }, [])

  // Helper function to format report display name as "Title (File Name)" or just file name if no title
  const getReportDisplayName = useCallback((report: typeof reports[0]): { title: string; fileName: string; hasTitle: boolean } => {
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
  }, [])

  return {
    getUploaderInfo,
    getAssignedReviewerNames,
    getReviewerStatus,
    getReportDisplayName
  }
}
