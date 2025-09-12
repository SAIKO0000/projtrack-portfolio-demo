import { type ReportWithUploader } from "@/lib/hooks/useReportsOptimized"

export type Project = {
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
  client?: string
}

export interface ProjectsProps {
  readonly onProjectSelect?: (projectId: string) => void
}

export interface ProjectModalState {
  editingProject: Project | null
  viewingReports: { 
    projectId: string; 
    projectName: string; 
    highlightReportId?: string 
  } | null
  reviewerNotesModal: {
    open: boolean
    action: 'approved' | 'revision' | 'rejected' | null
    reportId: string
    reportName: string
  }
  reviewerNotesViewerModal: {
    open: boolean
    reportName: string
    reviewerNotes: string
    reportDetails?: {
      uploader?: string
      uploadDate?: string
      category?: string
      status?: string
      description?: string
    }
  }
  simpleNotesModal: {
    open: boolean
    reportId: string
    reportName: string
    existingNotes: string
  }
  documentViewerModal: {
    open: boolean
    report: ReportWithUploader | null
  }
  deleteProjectDialog: {
    open: boolean
    project: Project | null
    isDeleting: boolean
  }
  deleteReportDialog: {
    open: boolean
    report: ReportWithUploader | null
    isDeleting: boolean
  }
}

export interface ProjectFilters {
  searchTerm: string
  statusFilter: string
  projectFilter: string
}

// Extend window interface for refresh tracking
declare global {
  interface Window {
    lastRefreshTime?: number
  }
}
