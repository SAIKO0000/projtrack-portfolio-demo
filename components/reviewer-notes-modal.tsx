"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, RotateCcw, X, FileText, User, Calendar } from "lucide-react"
import { useModalMobileHide } from "@/lib/modal-mobile-utils"

interface ReviewerNotesModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onSubmitAction: (action: 'approved' | 'revision' | 'rejected', notes: string) => void
  reportName: string
  action: 'approved' | 'revision' | 'rejected' | null
  existingNotes?: string
  reportDetails?: {
    uploader?: string
    uploadDate?: string
    category?: string
    status?: string
    description?: string
  }
}

export function ReviewerNotesModal({ 
  open, 
  onOpenChangeAction, 
  onSubmitAction, 
  reportName, 
  action,
  existingNotes = "",
  reportDetails
}: ReviewerNotesModalProps) {
  // Hide mobile header when modal is open
  useModalMobileHide(open)
  
  const [notes, setNotes] = useState(existingNotes)

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
      <DialogContent className="sm:max-w-[600px] z-[60] rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200/50">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            {actionDetails.icon}
            <div className="flex flex-col">
              <span>{actionDetails.title}</span>
              <span className="text-sm font-normal text-gray-500 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {reportName}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {actionDetails.description}
          </DialogDescription>
        </DialogHeader>

        {/* Report Details Section */}
        {reportDetails && (
          <div className="bg-gray-50/80 rounded-lg p-4 mb-4 space-y-3">
            <h4 className="font-medium text-gray-800 text-sm uppercase tracking-wide">Report Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportDetails.uploader && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Uploader:</span> {reportDetails.uploader}
                  </span>
                </div>
              )}
              {reportDetails.uploadDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Date:</span> {new Date(reportDetails.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {reportDetails.category && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {reportDetails.category}
                  </Badge>
                </div>
              )}
              {reportDetails.status && (
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${
                    reportDetails.status === 'approved' ? 'bg-green-100 text-green-800' :
                    reportDetails.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    reportDetails.status === 'revision' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    Current: {reportDetails.status.charAt(0).toUpperCase() + reportDetails.status.slice(1)}
                  </Badge>
                </div>
              )}
            </div>
            {reportDetails.description && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-700 text-sm">Description:</span>
                <p className="text-sm text-gray-600 mt-1">{reportDetails.description}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-medium flex items-center gap-2">
              Review Notes 
              {isRevisionOrRejection && <span className="text-red-500 text-sm">*Required</span>}
              {!isRevisionOrRejection && <span className="text-gray-500 text-sm">(Optional)</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder={actionDetails.placeholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] resize-none border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
              required={isRevisionOrRejection}
            />
            {isRevisionOrRejection && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-700 font-medium">
                  📝 Notes are required when requesting revision or rejecting a report.
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Please provide clear feedback to help the uploader understand what needs to be addressed.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200/50">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChangeAction(false)}
            className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            className={`${actionDetails.buttonClass} w-full sm:w-auto text-white shadow-lg hover:shadow-xl transition-all duration-200`}
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
