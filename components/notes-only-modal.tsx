"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { FileText, Save } from "lucide-react"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { useModalMobileHide } from "@/lib/modal-mobile-utils"

interface Report {
  id: string
  file_name: string
  status: string | null
  category: string | null
  reviewer_notes?: string
}

interface NotesOnlyModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  report: Report | null
  onNotesSubmitAction: (reportId: string, notes: string) => Promise<void>
}

export function NotesOnlyModal({
  open,
  onOpenChangeAction,
  report,
  onNotesSubmitAction
}: NotesOnlyModalProps) {
  // Hide mobile header when modal is open
  useModalMobileHide(open)
  
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset notes when report changes
  useEffect(() => {
    if (report) {
      setNotes(report.reviewer_notes || '')
    }
  }, [report])

  const handleSaveNotes = async () => {
    if (!report) return
    
    setIsSubmitting(true)
    try {
      await onNotesSubmitAction(report.id, notes)
      toast.success('Notes saved successfully')
      onOpenChangeAction(false)
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!report) return null

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'revision': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusMessage = (status: string | null) => {
    switch (status) {
      case 'approved': return 'This report has been approved. You can add additional notes if needed.'
      case 'rejected': return 'This report has been rejected. You can update your rejection notes here.'
      case 'revision': return 'This report requires revision. You can update your revision notes here.'
      default: return 'Add notes for this report.'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] w-[95vw] sm:w-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl">
        <DialogHeader className="space-y-1 sm:space-y-2 p-2 sm:p-3 border-b border-gray-100">
          <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="block">Add/Edit Notes: {report.file_name}</span>
          </DialogTitle>
          <div className="flex items-center gap-1 sm:gap-2 mt-2">
            <Badge variant="outline" className="text-xs">{report.category}</Badge>
            <Badge className={cn("text-xs", getStatusColor(report.status))}>
              {report.status || 'pending'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-2 sm:space-y-4 p-2 sm:p-4">
          <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-blue-800">
              {getStatusMessage(report.status)}
            </p>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm font-medium">
              Reviewer Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add your notes, comments, or feedback here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24 sm:min-h-32 text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChangeAction(false)}
              className="h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={isSubmitting}
              className="h-8 sm:h-10 px-3 sm:px-4 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              {isSubmitting ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
