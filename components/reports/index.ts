// Export main component
export { ReportsRefactored } from './ReportsRefactored'

// Export sub-components
export { ReportsHeader } from './ReportsHeader'
export { ReportsStatsCards } from './ReportsStatsCards'
export { ReportsFilters } from './ReportsFilters'
export { ReportsList } from './ReportsList'
export { ReportItem } from './ReportItem'

// Export utilities and hooks
export { useReportsLogic } from './useReportsLogic'
export { getFileIcon } from './ReportsFileIcon'

// Export types
export type { 
  EnhancedReport, 
  ReportsProps, 
  ReviewerNotesModalState, 
  DeleteDialogState, 
  ReportDisplayName 
} from './types'

// Export utilities
export * from './reports-utils'
