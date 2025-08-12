"use client"

import { useState, useEffect } from "react"
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
  description?: string | null
  reviewer_notes?: string
}

interface DocumentViewerWithNotesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: Report | null
  onNotesSubmit: (reportId: string, notes: string) => Promise<void>
  onStatusChange?: (reportId: string, status: 'approved' | 'rejected' | 'revision', notes: string) => Promise<void>
  userRole: 'viewer' | 'reviewer' // viewer can only add notes, reviewer can also approve/reject
}

export function DocumentViewerWithNotesModal({
  open,
  onOpenChange,
  report,
  onNotesSubmit,
  onStatusChange,
  userRole
}: DocumentViewerWithNotesModalProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Reset notes when report changes
  useEffect(() => {
    if (report) {
      setNotes(report.reviewer_notes || '')
      // Load preview URL
      loadPreviewUrl()
    }
  }, [report]) // loadPreviewUrl is defined inside useEffect scope

  const loadPreviewUrl = async () => {
    if (!report) return
    
    setLoadingPreview(true)
    try {
      const url = await getFilePreviewUrl(report)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Failed to load preview:', error)
      setPreviewUrl(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!report) return
    
    setIsSubmitting(true)
    try {
      await onNotesSubmit(report.id, notes)
      toast.success('Notes saved successfully')
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusAction = async (action: 'approved' | 'rejected' | 'revision') => {
    if (!report || !onStatusChange) return

    // Require notes for rejection and revision
    if ((action === 'rejected' || action === 'revision') && !notes.trim()) {
      toast.error(`Notes are required when ${action === 'rejected' ? 'rejecting' : 'requesting revision for'} a report`)
      return
    }

    setIsSubmitting(true)
    try {
      await onStatusChange(report.id, action, notes)
      toast.success(`Report ${action} successfully`)
      onOpenChange(false)
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

  const getFilePreviewUrl = async (report: Report) => {
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
  }

  const renderFilePreview = () => {
    if (!report) return null

    const fileExtension = report.file_name.toLowerCase().split('.').pop()
    
    if (loadingPreview) {
      return (
        <div className="w-full h-96 border rounded-lg bg-gray-50 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      )
    }
    
    // Only try to preview PDFs and images if we have a preview URL
    if (previewUrl && (fileExtension === 'pdf' || ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || ''))) {
      return (
        <div className="w-full h-96 border rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full"
            title={`Preview of ${report.file_name}`}
            onError={() => {
              console.log('Failed to load document preview')
              setPreviewUrl(null) // This will trigger the fallback view
            }}
          />
        </div>
      )
    }

    // Fallback for non-previewable files or when preview fails
    return (
      <div className="w-full h-96 border rounded-lg bg-gray-50 flex flex-col items-center justify-center">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">
          {previewUrl ? 'Preview failed to load' : 'Preview not available for this file type'}
        </p>
        <p className="text-sm text-gray-500 mb-2">{report.file_name}</p>
        <p className="text-xs text-gray-400 mb-4">File type: {fileExtension?.toUpperCase()}</p>
        <Button 
          variant="outline" 
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download to View
        </Button>
      </div>
    )
  }

  if (!report) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {report.file_name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{report.category}</Badge>
                <Badge className={
                  report.status === 'approved' ? 'bg-green-100 text-green-800' :
                  report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  report.status === 'revision' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {report.status || 'pending'}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Document Preview */}
          <div className="flex flex-col">
            <h3 className="text-lg font-medium mb-3">Document Preview</h3>
            {renderFilePreview()}
          </div>

          {/* Notes Section */}
          <div className="flex flex-col">
            <h3 className="text-lg font-medium mb-3">Reviewer Notes</h3>
            <div className="flex-1 flex flex-col">
              <Label htmlFor="notes" className="mb-2">
                Notes and Comments
              </Label>
              <Textarea
                id="notes"
                placeholder="Add your notes, comments, or feedback here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 min-h-32 resize-none"
              />

              {report.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700">Report Description:</Label>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
              )}

              <div className="mt-6 space-y-3">
                {/* Save Notes Button */}
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSubmitting}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <Save className="h-4 w-4" />
                  Save Notes
                </Button>

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
      </DialogContent>
    </Dialog>
  )
}
