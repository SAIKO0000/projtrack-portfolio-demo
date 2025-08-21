import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  User,
  Eye,
  Share,
  Trash2,
  Download,
  Edit,
  X,
  RotateCcw,
  CheckCircle,
} from "lucide-react"
import { getFileIcon } from "./ReportsFileIcon"
import { capitalizeWords, getStatusColor, getCategoryColor, formatDate } from "./reports-utils"
import { type EnhancedReport, type ReportDisplayName } from "./types"
import { ReportUploadModal } from "../report-upload-modal"

interface ReportItemProps {
  report: EnhancedReport
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

export function ReportItem({
  report,
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
}: ReportItemProps) {
  const displayName = getReportDisplayName(report)

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getFileIcon(report.file_type, report.file_name)}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 break-words leading-tight">
                  {displayName.title}
                </h3>
                {displayName.hasTitle && (
                  <p className="text-xs text-gray-500 font-normal break-words leading-tight mt-0.5">
                    {displayName.fileName}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Badge className={getStatusColor(report.status || "pending")}>
                  {capitalizeWords(report.status) || "Pending"}
                </Badge>
                <Badge className={getCategoryColor(report.category || "Other")}>
                  {report.category || "Other"}
                </Badge>
              </div>
            </div>
            
            {/* Show reviewer notes right after status if available */}
            {report.reviewer_notes && (report.status === 'approved' || report.status === 'revision' || report.status === 'rejected') && (
              <div className="mt-5 p-1 ">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Reviewer Notes ({capitalizeWords(report.status)}):
                </p>
                <p className="text-xs text-gray-600">{report.reviewer_notes}</p>
              </div>
            )}
            
            <p className="text-sm font-medium text-gray-700">{report.projectName}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{report.uploader_name || "Unknown"}</span>
                  <span className="text-xs text-gray-400">{report.uploader_position || "Unknown Position"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(report.uploaded_at)}
                </span>
                <span className="font-medium">{report.file_size_mb}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons - Mobile Optimized */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1 pt-2 border-t border-gray-100">
        <Button 
          variant="ghost" 
          size="default" 
          onClick={() => onView(report)}
          className="h-10 px-5 py-2 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 group"
          title="View file"
        >
          <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="hidden sm:inline">View</span>
        </Button>
        <Button 
          variant="ghost" 
          size="default" 
          onClick={() => onEdit(report)}
          className="h-10 px-5 py-2 hover:bg-orange-100 hover:text-orange-600 transition-all duration-200 group"
          title="Edit document"
        >
          <Edit className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button 
          variant="ghost" 
          size="default" 
          onClick={() => onDownload(report)}
          className="h-10 px-5 py-2 hover:bg-green-100 hover:text-green-600 transition-all duration-200 group"
          title="Download file"
        >
          <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="hidden sm:inline">Download</span>
        </Button>
        <Button 
          variant="ghost" 
          size="default"
          onClick={() => onShare(report)}
          className="h-10 px-5 py-2 hover:bg-purple-100 hover:text-purple-600 transition-all duration-200 group"
          title="Share file"
        >
          <Share className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button 
          variant="ghost" 
          size="default" 
          onClick={() => onDelete(report)}
          className="h-10 px-5 py-2 hover:bg-red-100 hover:text-red-600 transition-all duration-200 group"
          title="Delete document"
        >
          <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="hidden sm:inline">Delete</span>
        </Button>

        {/* Approval/Rejection Buttons for Assigned Reviewers */}
        {isAdmin && report.status !== 'approved' && report.uploaded_by !== userId && isAssignedReviewer(report) && (
          <>
            <Button 
              variant="ghost" 
              size="default" 
              onClick={() => onStatusUpdate(report.id, 'approved')}
              className="h-12 px-6 hover:bg-green-100 hover:text-green-600 transition-all duration-200 group"
              title="Approve report"
            >
              <CheckCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline">Approve</span>
            </Button>
            <Button 
              variant="ghost" 
              size="default" 
              onClick={() => onStatusUpdate(report.id, 'revision')}
              className="h-12 px-6 hover:bg-yellow-100 hover:text-yellow-600 transition-all duration-200 group"
              title="Request revision"
            >
              <RotateCcw className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline">Revision</span>
            </Button>
            <Button 
              variant="ghost" 
              size="default" 
              onClick={() => onStatusUpdate(report.id, 'rejected')}
              className="h-12 px-6 hover:bg-red-100 hover:text-red-600 transition-all duration-200 group"
              title="Reject report"
            >
              <X className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline">Reject</span>
            </Button>
          </>
        )}
      </div>

      {/* Informational Messages */}
      <div className="mt-2 space-y-1">
        {/* Show message for admin users viewing their own reports */}
        {isAdmin && report.uploaded_by === userId && report.status !== 'approved' && (
          <p className="text-xs text-gray-500 italic">Cannot approve your own report</p>
        )}

        {/* Show assigned reviewer info for non-assigned reviewers */}
        {isAdmin && report.uploaded_by !== userId && report.status !== 'approved' && !isAssignedReviewer(report) && (
          <p className="text-xs text-gray-500 italic">Assigned to: {getAssignedReviewerName(report)}</p>
        )}

        {/* Replace Report Button for report owner when report is rejected/revision */}
        {report.uploaded_by === userId && (report.status === 'rejected' || report.status === 'revision') && (
          <div className="flex gap-1">
            <ReportUploadModal 
              preselectedProjectId={projects.find(p => p.name === report.projectName)?.id || ""}
              replacingReportId={report.id}
              onUploadComplete={onUploadComplete}
            >
              <Button
                size="default"
                variant="outline"
                className="h-10 px-5 py-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                Replace Report
              </Button>
            </ReportUploadModal>
          </div>
        )}
      </div>
    </div>
  )
}
