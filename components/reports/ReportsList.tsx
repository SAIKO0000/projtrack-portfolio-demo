import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { ReportItem } from "./ReportItem"
import { type EnhancedReport, type ReportDisplayName } from "./types"

interface ReportsListProps {
  loading: boolean
  filteredReports: EnhancedReport[]
  isAdmin: boolean
  userId?: string
  projects: Array<{ id: string; name: string }>
  getReportDisplayName: (report: EnhancedReport) => ReportDisplayName
  isAssignedReviewer: (report: EnhancedReport) => boolean
  getAssignedReviewerName: (report: EnhancedReport) => string
  onView: (report: EnhancedReport) => void
  onEdit: (report: EnhancedReport) => void
  onDownload: (report: EnhancedReport) => void
  onShare: (report: EnhancedReport) => void
  onDelete: (report: EnhancedReport) => void
  onStatusUpdate: (reportId: string, status: string) => void
  onUploadComplete: () => void
}

export function ReportsList({
  loading,
  filteredReports,
  isAdmin,
  userId,
  projects,
  getReportDisplayName,
  isAssignedReviewer,
  getAssignedReviewerName,
  onView,
  onEdit,
  onDownload,
  onShare,
  onDelete,
  onStatusUpdate,
  onUploadComplete,
}: ReportsListProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Documents</CardTitle>
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
          <div className="space-y-2">
            {filteredReports.map((report) => (
              <ReportItem
                key={report.id}
                report={report}
                isAdmin={isAdmin}
                userId={userId}
                projects={projects}
                getReportDisplayName={getReportDisplayName}
                isAssignedReviewer={isAssignedReviewer}
                getAssignedReviewerName={getAssignedReviewerName}
                onView={onView}
                onEdit={onEdit}
                onDownload={onDownload}
                onShare={onShare}
                onDelete={onDelete}
                onStatusUpdate={onStatusUpdate}
                onUploadComplete={onUploadComplete}
              />
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
  )
}
