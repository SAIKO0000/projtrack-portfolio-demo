"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Edit, FileText, FolderOpen, Tag, Clock, FileType, Save, X, User } from "lucide-react"
import { useReports } from "@/lib/hooks/useReports"
import { useProjects } from "@/lib/hooks/useProjects"
import { usePersonnel } from "@/lib/hooks/usePersonnel"
import { useAuth } from "@/lib/auth"
import { toast } from "react-hot-toast"
import type { Report } from "@/lib/supabase"
import { useModalMobileHide } from "@/lib/modal-mobile-utils"

type EnhancedReport = Report & {
  projectName: string
  file_size_mb: string
}

interface EditReportModalProps {
  readonly report: EnhancedReport | null
  readonly open: boolean
  readonly onOpenChangeAction: (open: boolean) => void
  readonly onReportUpdatedAction: () => void
}

export function EditReportModal({ report, open, onOpenChangeAction, onReportUpdatedAction }: EditReportModalProps) {
  // Hide mobile header when modal is open
  useModalMobileHide(open)
  
  const [fileName, setFileName] = useState("")
  const [projectId, setProjectId] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [description, setDescription] = useState("")
  const [assignedReviewer, setAssignedReviewer] = useState("")

  const { updateReport, uploading } = useReports()
  const { projects } = useProjects()
  const { personnel } = usePersonnel()
  const { user } = useAuth()

  // Check if current user can approve this report (not their own report + has privileges)
  const userPosition = (user as { position?: string })?.position || ""
  const isAuthorizedReviewer = ["Project Manager", "Senior Electrical Engineer", "Field Engineer", "Design Engineer"].includes(userPosition)
  const isOwnReport = report?.uploaded_by === user?.id
  const canApproveReject = isAuthorizedReviewer && !isOwnReport

  // Get authorized reviewers (excluding current user to prevent self-approval)
  const authorizedReviewers = personnel.filter(person => 
    ["Project Manager", "Senior Electrical Engineer", "Field Engineer", "Design Engineer"].includes(person.position || "") &&
    person.email !== user?.email // Exclude self from reviewers
  )

  const categories = [
    "Progress Report",
    "Safety Report", 
    "Completion Report",
    "Site Photos",
    "Technical Drawing",
    "Material List",
    "Inspection Report",
    "Quality Report",
    "Financial Report",
    "Other"
  ]

  // Status options - filter based on user permissions and report ownership
  const statuses = [
    { value: "pending", label: "Pending Review" },
    ...(canApproveReject ? [
      { value: "approved", label: "Approved" },
      { value: "revision", label: "Needs Revision" },
      { value: "rejected", label: "Rejected" }
    ] : [])
  ]

  // Initialize form data when report changes
  useEffect(() => {
    if (report) {
      setFileName(report.file_name || "")
      setProjectId(report.project_id || "")
      setCategory(report.category || "Progress Report")
      setStatus(report.status || "pending")
      setDescription(report.description || "")
      setAssignedReviewer(report.assigned_reviewer || "")
    }
  }, [report])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!report) {
      toast.error("No report selected")
      return
    }

    if (!fileName.trim()) {
      toast.error("Please enter a title for the report")
      return
    }

    if (!projectId) {
      toast.error("Please select a project")
      return
    }

    if (!category) {
      toast.error("Please select a category")
      return
    }

    if (!assignedReviewer) {
      toast.error("Please assign a reviewer for this document")
      return
    }

    try {
      await updateReport(report.id, {
        file_name: fileName.trim(),
        project_id: projectId,
        category,
        status,
        description: description.trim() || null
      })
      
      toast.success("Report updated successfully!")
      onOpenChangeAction(false)
      onReportUpdatedAction()
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Failed to update report")
    }
  }

  const handleCancel = () => {
    onOpenChangeAction(false)
  }

  if (!report) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] w-[95vw] sm:w-auto max-h-[85vh] sm:max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-xl">
        <DialogHeader className="space-y-1 sm:space-y-2 p-2 sm:p-3 border-b border-gray-100">
          <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 flex flex-col sm:flex-row items-center sm:items-start">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 shadow-lg">
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <span className="block">Edit Document</span>
              <span className="text-xs font-normal text-gray-600 block">Update document information and settings</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 p-2 sm:p-3">
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {/* Current File Info */}
            <div className="p-2 sm:p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">Current File</p>
                  <p className="text-xs text-gray-500 break-words">{report.file_name}</p>
                  <p className="text-xs text-gray-500">
                    {report.projectName} • {report.file_size_mb}
                  </p>
                </div>
              </div>
            </div>

            {/* Report Title */}
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                Report Title *
              </Label>
              <div className="relative">
                <FileText className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter a descriptive title for this report"
                  className="pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Project - Single row NOT centered */}
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                Project *
              </Label>
              <div className="relative">
                <FolderOpen className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10" />
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-xs sm:text-sm">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="text-xs sm:text-sm">
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category and Status in one row */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Category Selection */}
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <Tag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                  Category *
                </Label>
                <div className="relative">
                  <Tag className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10" />
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-xs sm:text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs sm:text-sm">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                  Status *
                  {isOwnReport && (
                    <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-1 sm:px-2 py-1 rounded">
                      Cannot self-approve
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10" />
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-xs sm:text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((stat) => (
                        <SelectItem key={stat.value} value={stat.value} className="text-xs sm:text-sm">
                          {stat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Assigned Reviewer */}
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                Assigned Reviewer *
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1 sm:px-2 py-1 rounded">
                  Authorized personnel only
                </span>
              </Label>
              <div className="relative">
                <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10" />
                <Select value={assignedReviewer} onValueChange={setAssignedReviewer}>
                  <SelectTrigger className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-xs sm:text-sm">
                    <SelectValue placeholder="Select authorized reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {authorizedReviewers.map((reviewer) => (
                      <SelectItem key={reviewer.id} value={reviewer.id} className="text-xs sm:text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{reviewer.name}</span>
                          <span className="text-xs text-gray-500">({reviewer.position})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <FileType className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                Description (Optional)
              </Label>
              <div className="relative">
                <FileType className="absolute left-2 sm:left-3 top-2 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description or notes about this report..."
                  rows={3}
                  className="pl-7 sm:pl-10 pt-2 sm:pt-3 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-gray-900 placeholder:text-gray-500 resize-none text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>Updating...</span>
              </div>
              <Progress value={100} className="h-1 sm:h-2" />
            </div>
          )}

          {/* Submit Buttons - Single row on mobile */}
          <div className="flex flex-row justify-end gap-2 pt-2 sm:pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={uploading}
              className="h-8 sm:h-10 px-3 sm:px-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploading}
              className="h-8 sm:h-10 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center justify-center rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
            >
              {uploading ? (
                <>
                  <Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-pulse" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Update Document
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
