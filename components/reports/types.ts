import { type ReportWithUploader } from "@/lib/hooks/useReportsOptimized"

export type EnhancedReport = ReportWithUploader & {
  projectName: string
  file_size_mb: string
  reviewer_notes?: string
}

export interface ReportsProps {
  onTabChangeAction?: (tab: string) => void
}

export interface ReviewerNotesModalState {
  open: boolean
  action: 'approved' | 'revision' | 'rejected' | null
  reportId: string
  reportName: string
}

export interface DeleteDialogState {
  open: boolean
  report: EnhancedReport | null
  isDeleting: boolean
}

export interface ReportDisplayName {
  title: string
  fileName: string
  hasTitle: boolean
}
