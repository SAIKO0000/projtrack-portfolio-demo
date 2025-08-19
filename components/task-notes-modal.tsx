"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { FileText, Save, StickyNote } from "lucide-react"
import { toast } from "react-hot-toast"

interface EnhancedTask {
  id: string
  title: string
  notes?: string | null
  project_name?: string
  status?: string | null
  alphabetical_id?: string
}

interface TaskNotesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: EnhancedTask | null
  onNotesSubmit: (taskId: string, notes: string) => Promise<void>
}

export function TaskNotesModal({
  open,
  onOpenChange,
  task,
  onNotesSubmit
}: TaskNotesModalProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset notes when task changes
  useEffect(() => {
    if (task) {
      setNotes(task.notes || '')
    }
  }, [task])

  const handleSaveNotes = async () => {
    if (!task) return
    
    setIsSubmitting(true)
    try {
      await onNotesSubmit(task.id, notes)
      toast.success('Notes saved successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    if (task) {
      setNotes(task.notes || '')
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <StickyNote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Task Notes
          </DialogTitle>
          
          {/* Task Info Header */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {task.alphabetical_id && (
                <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-100 text-gray-700 border-gray-300">
                  {task.alphabetical_id}
                </Badge>
              )}
              <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span><strong>Project:</strong> {task.project_name || 'Unknown'}</span>
              {task.status && (
                <Badge variant="secondary" className="capitalize">
                  {task.status.replace('-', ' ')}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Task Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for this task... (e.g., observations, issues, progress updates, technical details)"
              className="min-h-[200px] resize-y border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use this space to record important observations, issues encountered, progress updates, or any technical details related to this task.
            </p>
          </div>

          {/* Character count */}
          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
            {notes.length} characters
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNotes}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Notes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
