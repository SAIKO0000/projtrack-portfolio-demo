"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, User, Calendar, MessageSquare, X } from "lucide-react"
import { useModalMobileHide } from "@/lib/modal-mobile-utils"

interface ReviewerNotesViewerModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  reportName: string
  reviewerNotes: string
  reportDetails?: {
    uploader?: string
    uploadDate?: string
    category?: string
    status?: string
    description?: string
  }
}

export function ReviewerNotesViewerModal({ 
  open, 
  onOpenChangeAction, 
  reportName, 
  reviewerNotes,
  reportDetails
}: ReviewerNotesViewerModalProps) {
  // Hide mobile header when modal is open
  useModalMobileHide(open)

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[700px] z-[60] rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200/50 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-gray-200/50">
          <div className="flex items-start justify-between">
            <div className="flex flex-col flex-1">
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold mb-2">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                <span>Reviewer Notes</span>
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{reportName}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChangeAction(false)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Report Details Section */}
          {reportDetails && (
            <div className="bg-gray-50/80 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-800 text-sm uppercase tracking-wide">Report Information</h4>
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
                      Status: {reportDetails.status.charAt(0).toUpperCase() + reportDetails.status.slice(1)}
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

          {/* Reviewer Notes Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Review Comments</h3>
              <Badge variant="outline" className="text-xs">
                {reviewerNotes ? 'Has Notes' : 'No Notes'}
              </Badge>
            </div>

            {reviewerNotes ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {reviewerNotes}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No reviewer notes available</p>
                <p className="text-sm text-gray-400 mt-1">
                  This report has not been reviewed yet or no comments were provided.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200/50 pt-4 flex justify-end">
          <Button 
            onClick={() => onOpenChangeAction(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
