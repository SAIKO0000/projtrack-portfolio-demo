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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mr-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            Delete Event
          </DialogTitle>
          <DialogDescription className="ml-13">
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-gray-900 mb-1">Event to be deleted:</h4>
          <p className="text-sm text-gray-600">"{eventTitle}"</p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
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