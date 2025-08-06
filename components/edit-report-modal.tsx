"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Edit, FileText, FolderOpen, Tag, Clock, FileType, Save } from "lucide-react"
import { useReports } from "@/lib/hooks/useReports"
import { useProjects } from "@/lib/hooks/useProjects"
import { toast } from "react-hot-toast"
import type { Report } from "@/lib/supabase"

type EnhancedReport = Report & {
  projectName: string
  file_size_mb: string
}

interface EditReportModalProps {
  readonly report: EnhancedReport | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onReportUpdated: () => void
}

export function EditReportModal({ report, open, onOpenChange, onReportUpdated }: EditReportModalProps) {
  const [fileName, setFileName] = useState("")
  const [projectId, setProjectId] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [description, setDescription] = useState("")

  const { updateReport, uploading } = useReports()
  const { projects } = useProjects()

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

  const statuses = [
    { value: "pending", label: "Pending Review" },
    { value: "approved", label: "Approved" },
    { value: "revision", label: "Needs Revision" },
    { value: "rejected", label: "Rejected" }
  ]

  // Initialize form data when report changes
  useEffect(() => {
    if (report) {
      setFileName(report.file_name || "")
      setProjectId(report.project_id || "")
      setCategory(report.category || "Progress Report")
      setStatus(report.status || "pending")
      setDescription(report.description || "")
    }
  }, [report])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!report) {
      toast.error("No report selected")
      return
    }

    if (!fileName.trim()) {
      toast.error("Please enter a file name")
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

    try {
      await updateReport(report.id, {
        file_name: fileName.trim(),
        project_id: projectId,
        category,
        status,
        description: description.trim() || null
      })
      
      toast.success("Report updated successfully!")
      onOpenChange(false)
      onReportUpdated()
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Failed to update report")
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!report) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mr-3 shadow-sm">
              <Edit className="h-5 w-5 text-orange-600" />
            </div>
            Edit Document
          </DialogTitle>
          <DialogDescription className="text-gray-600 ml-13">
            Update document information and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current File Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Current File</p>
                <p className="text-xs text-gray-500 truncate">{report.file_name}</p>
                <p className="text-xs text-gray-500">
                  {report.projectName} • {report.file_size_mb}
                </p>
              </div>
            </div>
          </div>

          {/* File Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              File Name *
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center">
              <FolderOpen className="h-4 w-4 mr-2 text-gray-500" />
              Project *
            </Label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full pl-10">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center">
              <Tag className="h-4 w-4 mr-2 text-gray-500" />
              Category *
            </Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full pl-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              Status *
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full pl-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((stat) => (
                    <SelectItem key={stat.value} value={stat.value}>
                      {stat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center">
              <FileType className="h-4 w-4 mr-2 text-gray-500" />
              Description (Optional)
            </Label>
            <div className="relative">
              <FileType className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description or notes..."
                rows={3}
                className="pl-10"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Updating...</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex items-center"
            >
              {uploading ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-pulse" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
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
