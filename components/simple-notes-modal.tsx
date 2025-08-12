"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText } from "lucide-react"

interface SimpleNotesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (notes: string) => void
  reportName: string
  existingNotes?: string
}

export function SimpleNotesModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  reportName,
  existingNotes = ""
}: SimpleNotesModalProps) {
  const [notes, setNotes] = useState("")

  // Update notes when modal opens or existing notes change
  useEffect(() => {
    if (open) {
      setNotes(existingNotes)
    }
  }, [open, existingNotes])

  const handleSubmit = () => {
    onSubmit(notes)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Reviewer Notes
          </DialogTitle>
          <DialogDescription>
            Add or edit reviewer notes for this report
            <br />
            <span className="font-medium text-gray-700">Report: {reportName}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="notes">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add your review notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-sm text-gray-600">
              These notes will be visible to the report uploader and other reviewers.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
          >
            Save Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
