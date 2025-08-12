"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { FileText, Save } from "lucide-react"
import { toast } from "react-hot-toast"

interface Report {
  id: string
  file_name: string
  status: string | null
  category: string | null
  reviewer_notes?: string
}

interface NotesOnlyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: Report | null
  onNotesSubmit: (reportId: string, notes: string) => Promise<void>
}

export function NotesOnlyModal({
  open,
  onOpenChange,
  report,
  onNotesSubmit
}: NotesOnlyModalProps) {
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
      await onNotesSubmit(report.id, notes)
      toast.success('Notes saved successfully')
      onOpenChange(false)
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!report) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'revision': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved': return 'This report has been approved. You can add additional notes if needed.'
      case 'rejected': return 'This report has been rejected. You can update your rejection notes here.'
      case 'revision': return 'This report requires revision. You can update your revision notes here.'
      default: return 'Add notes for this report.'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add/Edit Notes: {report.file_name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{report.category}</Badge>
            <Badge className={getStatusColor(report.status)}>
              {report.status || 'pending'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              {getStatusMessage(report.status)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Reviewer Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add your notes, comments, or feedback here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-32"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
