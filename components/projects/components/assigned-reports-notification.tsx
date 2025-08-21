import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { type Project } from "../types/project-types"
import { useFormatDate } from "../utils"

interface AssignedReportsNotificationProps {
  assignedReports: Array<{
    id: string
    project_id: string | null
    uploaded_at: string | null
    file_name: string
    title?: string
  }>
  projects: Project[]
  onReportClick: (projectId: string, projectName: string, reportId: string) => void
  getReportDisplayName: (report: {
    id: string
    file_name: string
    title?: string
  }) => { title: string; fileName: string; hasTitle: boolean }
  formatDate: (dateString: string | null) => string
}

export function AssignedReportsNotification({ 
  assignedReports, 
  projects, 
  onReportClick,
  getReportDisplayName 
}: AssignedReportsNotificationProps) {
  const formatDate = useFormatDate()

  if (assignedReports.length === 0) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/95 backdrop-blur-sm shadow-lg border border-blue-200/50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-800">
            Reports Assigned for Review ({assignedReports.length})
          </CardTitle>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          You have {assignedReports.length} pending report{assignedReports.length > 1 ? 's' : ''} to review
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {assignedReports.map((report) => {
            const reportProject = projects.find(p => p.id === report.project_id)
            return (
              <div
                key={report.id}
                className="bg-white rounded-lg p-4 border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => {
                  if (reportProject) {
                    onReportClick(reportProject.id, reportProject.name, report.id)
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
                      <span>📅 Uploaded: {formatDate(report.uploaded_at || null)}</span>
                      <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">
                        Pending Review
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click
                      if (reportProject) {
                        onReportClick(reportProject.id, reportProject.name, report.id)
                      }
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 h-8 px-3"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Review Now
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
