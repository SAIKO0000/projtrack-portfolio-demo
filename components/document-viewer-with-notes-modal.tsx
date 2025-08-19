"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { FileText, Download, Save } from "lucide-react"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"

interface Report {
  id: string
  file_name: string
  file_path: string
  status: string | null
  category: string | null
  project_id?: string | null
  uploaded_by?: string | null
  uploaded_at?: string | null
  file_size?: number | null
  file_type?: string | null
  description?: string | null
  reviewer_notes?: string
  uploader_name?: string
  uploader_position?: string
  assigned_reviewer?: string
  title?: string
}

interface DocumentViewerWithNotesModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  report: Report | null
  onNotesSubmitAction: (reportId: string, notes: string) => Promise<void>
  onStatusChangeAction?: (reportId: string, status: 'approved' | 'rejected' | 'revision', notes: string) => Promise<void>
  userRole: 'viewer' | 'reviewer' // viewer can only add notes, reviewer can also approve/reject
}

export function DocumentViewerWithNotesModal({
  open,
  onOpenChangeAction,
  report,
  onNotesSubmitAction,
  onStatusChangeAction,
  userRole
}: DocumentViewerWithNotesModalProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [documentOrientation, setDocumentOrientation] = useState<'portrait' | 'landscape' | 'unknown'>('unknown')

  const detectDocumentOrientation = useCallback((url: string) => {
    const fileExtension = report?.file_name.toLowerCase().split('.').pop()
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
      // For images, load and check dimensions
      const img = new Image()
      img.onload = () => {
        const orientation = img.width > img.height ? 'landscape' : 'portrait'
        setDocumentOrientation(orientation)
      }
      img.onerror = () => setDocumentOrientation('unknown')
      img.src = url
    } else if (fileExtension === 'pdf') {
      // For PDFs, assume portrait by default (most common)
      // In a real implementation, you might use a PDF.js library to get actual dimensions
      setDocumentOrientation('portrait')
    } else {
      setDocumentOrientation('unknown')
    }
  }, [report])

  const getFilePreviewUrl = useCallback(async (report: Report) => {
    try {
      // Try to get a signed URL for viewing
      const { data, error } = await supabase.storage
        .from('project-reports')
        .createSignedUrl(report.file_path, 3600) // 1 hour expiry

      if (error) throw error
      return data.signedUrl
    } catch (error) {
      console.error('Error getting preview URL:', error)
      return null
    }
  }, [])

  const loadPreviewUrl = useCallback(async () => {
    if (!report) return
    
    setLoadingPreview(true)
    try {
      const url = await getFilePreviewUrl(report)
      setPreviewUrl(url)
      
      // Detect document orientation for PDFs and images
      if (url) {
        detectDocumentOrientation(url)
      }
    } catch (error) {
      console.error('Failed to load preview:', error)
      setPreviewUrl(null)
    } finally {
      setLoadingPreview(false)
    }
  }, [report, getFilePreviewUrl, detectDocumentOrientation])

  // Reset notes when report changes
  useEffect(() => {
    if (report) {
      setNotes(report.reviewer_notes || '')
      // Load preview URL
      loadPreviewUrl()
    }
  }, [report, loadPreviewUrl])

  const handleSaveNotes = async () => {
    if (!report) return
    
    setIsSubmitting(true)
    try {
      await onNotesSubmitAction(report.id, notes)
      toast.success('Notes saved successfully')
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusAction = async (action: 'approved' | 'rejected' | 'revision') => {
    if (!report || !onStatusChangeAction) return

    // Require notes for rejection and revision
    if ((action === 'rejected' || action === 'revision') && !notes.trim()) {
      toast.error(`Notes are required when ${action === 'rejected' ? 'rejecting' : 'requesting revision for'} a report`)
      return
    }

    setIsSubmitting(true)
    try {
      await onStatusChangeAction(report.id, action, notes)
      toast.success(`Report ${action} successfully`)
      onOpenChangeAction(false)
    } catch {
      toast.error(`Failed to ${action} report`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = async () => {
    if (!report) return
    
    try {
      const { data, error } = await supabase.storage
        .from('project-reports')
        .download(report.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = report.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const renderFilePreview = () => {
    if (!report) return null

    const fileExtension = report.file_name.toLowerCase().split('.').pop()
    
    if (loadingPreview) {
      return (
        <div className="w-full h-64 sm:h-80 lg:h-96 border rounded-lg bg-gray-50 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      )
    }
    
    // Determine container classes based on orientation and device
    const getPreviewContainerClass = () => {
      const baseClass = "w-full border rounded-lg overflow-hidden"
      
      if (documentOrientation === 'landscape') {
        return `${baseClass} h-64 sm:h-80 lg:h-[500px]` // Wider for landscape
      } else if (documentOrientation === 'portrait') {
        return `${baseClass} h-80 sm:h-96 lg:h-[600px]` // Taller for portrait
      } else {
        return `${baseClass} h-64 sm:h-80 lg:h-96` // Default
      }
    }
    
    // Only try to preview PDFs and images if we have a preview URL
    if (previewUrl && (fileExtension === 'pdf' || ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || ''))) {
      return (
        <div className={getPreviewContainerClass()}>
          {/* For mobile, provide better PDF viewing options */}
          {fileExtension === 'pdf' ? (
            <div className="w-full h-full">
              {/* Mobile: Show download link instead of iframe for better compatibility */}
              <div className="w-full h-full flex flex-col items-center justify-center block md:hidden bg-gray-50 border border-gray-200 rounded-lg">
                <FileText className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4 text-center px-4">
                  PDF preview may not work properly on mobile devices. Download to view the document.
                </p>
                <Button
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
              {/* Desktop: Use regular iframe */}
              <iframe
                src={previewUrl}
                className="w-full h-full hidden md:block border border-gray-200 rounded-lg"
                title={`Preview of ${report.file_name}`}
                onError={() => {
                  console.log('Failed to load document preview')
                  setPreviewUrl(null)
                }}
              />
            </div>
          ) : (
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title={`Preview of ${report.file_name}`}
              onError={() => {
                console.log('Failed to load document preview')
                setPreviewUrl(null)
              }}
            />
          )}
        </div>
      )
    }

    // Fallback for non-previewable files or when preview fails
    return (
      <div className="w-full h-64 sm:h-80 lg:h-96 border rounded-lg bg-gray-50 flex flex-col items-center justify-center">
        <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2 text-center px-4">
          {previewUrl ? 'Preview failed to load' : 'Preview not available for this file type'}
        </p>
        <p className="text-sm text-gray-500 mb-2 text-center px-4 break-words max-w-full">{report.file_name}</p>
        <p className="text-xs text-gray-400 mb-4">File type: {fileExtension?.toUpperCase()}</p>
        <Button 
          variant="outline" 
          onClick={handleDownload}
          className="flex items-center gap-2"
          size="sm"
        >
          <Download className="h-4 w-4" />
          Download to View
        </Button>
      </div>
    )
  }

  if (!report) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col p-0 relative fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <DialogHeader className="p-4 sm:p-6 border-b pr-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-sm sm:text-base break-words">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{report.file_name}</span>
              </DialogTitle>
              {/* Show badges only on desktop (hidden on mobile) */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">{report.category}</Badge>
                <Badge className={`text-xs ${
                  report.status === 'approved' ? 'bg-green-100 text-green-800' :
                  report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  report.status === 'revision' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {(report.status || 'pending').charAt(0).toUpperCase() + (report.status || 'pending').slice(1)}
                </Badge>
                {documentOrientation !== 'unknown' && (
                  <Badge variant="secondary" className="text-xs">
                    {documentOrientation.charAt(0).toUpperCase() + documentOrientation.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="hidden sm:flex items-center gap-2 flex-shrink-0"
              size="sm"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 p-4 sm:p-6">
          {/* Mobile: Stacked Layout */}
          <div className="lg:hidden space-y-6">
            {/* Document Preview */}
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="text-base sm:text-lg font-medium">Document Preview</h3>
                <Badge variant="outline" className="text-xs">{report.category}</Badge>
                <Badge className={`text-xs ${
                  report.status === 'approved' ? 'bg-green-100 text-green-800' :
                  report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  report.status === 'revision' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {(report.status || 'pending').charAt(0).toUpperCase() + (report.status || 'pending').slice(1)}
                </Badge>
                {documentOrientation !== 'unknown' && (
                  <Badge variant="secondary" className="text-xs">
                    {documentOrientation.charAt(0).toUpperCase() + documentOrientation.slice(1)}
                  </Badge>
                )}
              </div>
              {renderFilePreview()}
              {/* Centered Download Button for Mobile */}
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-medium mb-3">Reviewer Notes</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes-mobile" className="mb-2 text-sm">
                    Notes and Comments
                  </Label>
                  <Textarea
                    id="notes-mobile"
                    placeholder={userRole === 'viewer' ? "View only - You are not assigned to review this report" : "Add your notes, comments, or feedback here..."}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-24 resize-none text-sm"
                    rows={4}
                    disabled={userRole === 'viewer'}
                    readOnly={userRole === 'viewer'}
                  />
                </div>

                {report.description && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700">Report Description:</Label>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Save Notes Button - Only show for reviewers */}
                  {userRole === 'reviewer' && (
                    <Button
                      onClick={handleSaveNotes}
                      disabled={isSubmitting}
                      className="w-full flex items-center gap-2"
                      variant="outline"
                      size="sm"
                    >
                      <Save className="h-4 w-4" />
                      Save Notes
                    </Button>
                  )}

                  {/* Reviewer Actions */}
                  {userRole === 'reviewer' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Reviewer Actions:</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={() => handleStatusAction('approved')}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          size="sm"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleStatusAction('revision')}
                          disabled={isSubmitting}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                          size="sm"
                        >
                          Revision
                        </Button>
                        <Button
                          onClick={() => handleStatusAction('rejected')}
                          disabled={isSubmitting}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs"
                          size="sm"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Side-by-side Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6 h-full min-h-0">
            {/* Document Preview */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-lg font-medium mb-3">Document Preview</h3>
              <div className="flex-1 min-h-0">
                {renderFilePreview()}
              </div>
            </div>

            {/* Notes Section */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-lg font-medium mb-3">Reviewer Notes</h3>
              <div className="flex-1 flex flex-col min-h-0">
                <Label htmlFor="notes-desktop" className="mb-2">
                  Notes and Comments
                </Label>
                <Textarea
                  id="notes-desktop"
                  placeholder={userRole === 'viewer' ? "View only - You are not assigned to review this report" : "Add your notes, comments, or feedback here..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-1 min-h-32 resize-none"
                  disabled={userRole === 'viewer'}
                  readOnly={userRole === 'viewer'}
                />

                {report.description && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700">Report Description:</Label>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {/* Save Notes Button - Only show for reviewers */}
                  {userRole === 'reviewer' && (
                    <Button
                      onClick={handleSaveNotes}
                      disabled={isSubmitting}
                      className="w-full flex items-center gap-2"
                      variant="outline"
                    >
                      <Save className="h-4 w-4" />
                      Save Notes
                    </Button>
                  )}

                  {/* Reviewer Actions */}
                  {userRole === 'reviewer' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Reviewer Actions:</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={() => handleStatusAction('approved')}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleStatusAction('revision')}
                          disabled={isSubmitting}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          size="sm"
                        >
                          Revision
                        </Button>
                        <Button
                          onClick={() => handleStatusAction('rejected')}
                          disabled={isSubmitting}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
