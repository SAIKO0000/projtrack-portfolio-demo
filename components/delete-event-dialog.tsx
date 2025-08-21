"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { useEvents } from "@/lib/hooks/useEvents"
import { toast } from "react-hot-toast"

interface DeleteEventDialogProps {
  readonly eventId: string
  readonly eventTitle: string
  readonly onEventDeleted?: () => void
  readonly trigger?: React.ReactNode
  readonly open?: boolean
  readonly onOpenChange?: (open: boolean) => void
}

export function DeleteEventDialog({ 
  eventId, 
  eventTitle, 
  onEventDeleted,
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: DeleteEventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteEvent } = useEvents()
  // Use external open state if provided, otherwise use internal state
  const open = externalOpen ?? internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteEvent(eventId)
      toast.success("Event deleted successfully!")
      setOpen(false)
      onEventDeleted?.()
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Failed to delete event. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle the trigger click to prevent dropdown from closing
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          <div 
            onClick={handleTriggerClick} 
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleTriggerClick(e as any)
              }
            }}
          >
            {trigger}
          </div>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[420px] max-w-[95vw] w-[95vw] sm:w-auto rounded-2xl shadow-2xl border-0">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center text-red-600">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            </div>
            <span className="text-lg sm:text-xl font-bold">Delete Event</span>
          </DialogTitle>
          <DialogDescription className="ml-10 sm:ml-13 text-sm sm:text-base text-gray-600">
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 p-3 sm:p-4 rounded-xl mb-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Event to be deleted:</h4>
          <p className="text-xs sm:text-sm text-gray-600 break-words">&ldquo;{eventTitle}&rdquo;</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm rounded-lg border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm bg-red-600 hover:bg-red-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Event
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}