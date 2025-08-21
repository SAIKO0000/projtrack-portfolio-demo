"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, RotateCcw, X } from "lucide-react"

interface ReviewerNotesModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onSubmitAction: (action: 'approved' | 'revision' | 'rejected', notes: string) => void
  reportName: string
  action: 'approved' | 'revision' | 'rejected' | null
}

export function ReviewerNotesModal({ 
  open, 
  onOpenChangeAction, 
  onSubmitAction, 
  reportName, 
  action
}: ReviewerNotesModalProps) {
  const [notes, setNotes] = useState("")

  console.log('ReviewerNotesModal rendered with props:', { open, reportName, action })

  const handleSubmit = () => {
    if (action) {
      onSubmitAction(action, notes)
      setNotes("") // Clear notes after submission
      onOpenChangeAction(false)
    }
  }

  const getActionDetails = () => {
    switch (action) {
      case 'approved':
        return {
          title: 'Approve Report',
          description: 'Provide any additional comments for this approval (optional)',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          buttonText: 'Approve Report',
          buttonClass: 'bg-green-600 hover:bg-green-700',
          placeholder: 'Add any comments about the approval (optional)...'
        }
      case 'revision':
        return {
          title: 'Request Revision',
          description: 'Please explain what needs to be revised',
          icon: <RotateCcw className="h-5 w-5 text-yellow-600" />,
          buttonText: 'Request Revision',
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
          placeholder: 'Explain what needs to be revised and why...'
        }
      case 'rejected':
        return {
          title: 'Reject Report',
          description: 'Please explain why this report is being rejected',
          icon: <X className="h-5 w-5 text-red-600" />,
          buttonText: 'Reject Report',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          placeholder: 'Explain the reason for rejection...'
        }
      default:
        return {
          title: 'Review Report',
          description: 'Add your review notes',
          icon: null,
          buttonText: 'Submit',
          buttonClass: 'bg-blue-600 hover:bg-blue-700',
          placeholder: 'Add your notes...'
        }
    }
  }

  const actionDetails = getActionDetails()
  const isRevisionOrRejection = action === 'revision' || action === 'rejected'

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[525px] z-[60] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {actionDetails.icon}
            {actionDetails.title}
          </DialogTitle>
          <DialogDescription>
            {actionDetails.description}
            <br />
            <span className="font-medium text-gray-700">Report: {reportName}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="notes">
              Review Notes {isRevisionOrRejection ? <span className="text-red-500">*</span> : '(Optional)'}
            </Label>
            <Textarea
              id="notes"
              placeholder={actionDetails.placeholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
              required={isRevisionOrRejection}
            />
            {isRevisionOrRejection && (
              <p className="text-sm text-gray-600">
                Notes are required when requesting revision or rejecting a report.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChangeAction(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            className={actionDetails.buttonClass}
            onClick={handleSubmit}
            disabled={isRevisionOrRejection && notes.trim() === ""}
          >
            {actionDetails.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
