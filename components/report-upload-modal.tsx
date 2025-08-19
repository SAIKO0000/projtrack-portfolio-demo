"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileText, FolderOpen, Tag, Clock, FileType, File, FileSpreadsheet, FileImage, Archive, Layers, Video, Music, FileCode, User } from "lucide-react"
import { useReports } from "@/lib/hooks/useReports"
import { useProjects } from "@/lib/hooks/useProjects"
import { usePersonnel } from "@/lib/hooks/usePersonnel"
import { useAuth } from "@/lib/auth"
import { toast } from "react-hot-toast"

interface ReportUploadModalProps {
  readonly children?: React.ReactNode
  readonly onUploadComplete?: () => void
  readonly preselectedProjectId?: string
  readonly replacingReportId?: string
}

export function ReportUploadModal({ children, onUploadComplete, preselectedProjectId, replacingReportId }: ReportUploadModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [projectId, setProjectId] = useState(preselectedProjectId || "")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("pending")
  const [description, setDescription] = useState("")
  const [assignedReviewer, setAssignedReviewer] = useState("")

  const { uploadReport, uploading, uploadProgress, replaceReport } = useReports()
  const { projects } = useProjects()
  const { personnel } = usePersonnel()
  const { user } = useAuth()

  // Set initial status when modal opens - always pending for uploads
  useEffect(() => {
    if (open) {
      setStatus("pending") // Always pending for new uploads
    }
  }, [open])

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

  const statuses = [
    { value: "pending", label: "Pending Review" }
    // Removed self-approval options - only reviewers can approve/reject via other interface
  ]
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files?.[0]) {
      setSelectedFile(files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error("Please select a file to upload")
      return
    }

    if (!title.trim()) {
      toast.error("Please enter a title for the report")
      return
    }

    if (!replacingReportId && !projectId) {
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
      if (replacingReportId) {
        // Replace existing report
        await replaceReport(replacingReportId, selectedFile, category, status, description, title)
        toast.success("Report replaced successfully!")
      } else {
        // Upload new report with single reviewer
        await uploadReport(selectedFile, projectId, category, status, description, assignedReviewer, title)
        toast.success("Report uploaded successfully!")
      }
      
      // Reset form
      setSelectedFile(null)
      setTitle("")
      setProjectId(preselectedProjectId || "")
      setCategory("")
      setStatus("pending") // Always reset to pending
      setDescription("")
      setAssignedReviewer("")
      setOpen(false)
      
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(replacingReportId ? "Failed to replace report" : "Failed to upload report")
    }
  }

  const getFileIcon = (file: File) => {
    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()
    const extension = fileName.split('.').pop() || ''
    
    // Document files
    if (fileType.includes('pdf') || extension === 'pdf') {
      return (
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
          <FileText className="h-5 w-5 text-red-600" />
        </div>
      )
    }
    if (fileType.includes('word') || fileType.includes('doc') || ['doc', 'docx'].includes(extension)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
      )
    }
    if (fileType.includes('text') || extension === 'txt') {
      return (
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <FileType className="h-5 w-5 text-gray-600" />
        </div>
      )
    }
    
    // Spreadsheet files
    if (fileType.includes('excel') || fileType.includes('sheet') || ['xlsx', 'xls', 'csv'].includes(extension)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
        </div>
      )
    }
    
    // Image files
    if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <FileImage className="h-5 w-5 text-purple-600" />
        </div>
      )
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
          <Archive className="h-5 w-5 text-yellow-600" />
        </div>
      )
    }
    
    // CAD/Technical files
    if (['dwg', 'dxf', 'cad'].includes(extension)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
          <Layers className="h-5 w-5 text-cyan-600" />
        </div>
      )
    }
    
    // Video files
    if (fileType.includes('video') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
          <Video className="h-5 w-5 text-pink-600" />
        </div>
      )
    }
    
    // Audio files
    if (fileType.includes('audio') || ['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Music className="h-5 w-5 text-indigo-600" />
        </div>
      )
    }
    
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c'].includes(extension)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
          <FileCode className="h-5 w-5 text-orange-600" />
        </div>
      )
    }
    
    // Default file icon
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <File className="h-5 w-5 text-gray-500" />
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>      <DialogContent className="sm:max-w-2xl w-[95vw] max-w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
              <Upload className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span>{replacingReportId ? "Replace Document" : "Upload Document"}</span>
              <DialogDescription className="text-base text-gray-600 font-normal mt-1">
                {replacingReportId ? "Replace the existing document with a new version" : "Upload a new document or report to the project"}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Document File *
            </Label>
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-200 cursor-pointer">
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.dwg,.dxf,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.mp4,.avi,.mov,.mp3,.wav,.js,.ts,.html,.css,.json,.xml,.py,.java,.cpp,.c,.ppt,.pptx"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-base font-medium text-gray-700 mb-2">Choose a file to upload</p>
                  <p className="text-sm text-gray-500">
                    Supports documents, images, archives, CAD files, and more
                  </p>
                </Label>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-start space-x-4">
                  {getFileIcon(selectedFile)}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 break-words">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatFileSize(selectedFile.size)} • Ready to upload
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="p-2 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Title Field */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Report Title *
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for this report"
                className="pl-10 h-12 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                required
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border">
                <span className="font-medium">File:</span> <span className="break-all">{selectedFile.name}</span>
              </p>
            )}
          </div>          {/* Project Selection - Hidden when replacing */}
          {!replacingReportId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <FolderOpen className="h-4 w-4 mr-2 text-gray-500" />
                Project *
              </Label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-full pl-10">
                    <SelectValue placeholder="Select a project" />                  </SelectTrigger>
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
          )}          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center">
              <Tag className="h-4 w-4 mr-2 text-gray-500" />
              Category *
            </Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full pl-10">
                  <SelectValue placeholder="Select category" />                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>          {/* Status Selection */}
          <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-900 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              Status *
              <span className="ml-2 text-xs text-gray-500">(Auto-set to Pending)</span>
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Select value={status} onValueChange={setStatus} disabled={true}>
                <SelectTrigger className="w-full pl-10">
                  <SelectValue placeholder="Select status" />                </SelectTrigger>
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

          {/* Assigned Reviewer */}
          <div className="space-y-2">
            <Label htmlFor="reviewer">Assigned Reviewer <span className="text-red-500">*</span></Label>
            <Select value={assignedReviewer} onValueChange={setAssignedReviewer}>
              <SelectTrigger id="reviewer">
                <SelectValue placeholder="Select a reviewer" />
              </SelectTrigger>
              <SelectContent>
                {authorizedReviewers.map((reviewer) => (
                  <SelectItem key={reviewer.id} value={reviewer.id}>
                    {reviewer.name} ({reviewer.position || 'No position'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploading || !selectedFile}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex items-center"
            >
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  {replacingReportId ? "Replacing..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {replacingReportId ? "Replace Document" : "Upload Document"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
