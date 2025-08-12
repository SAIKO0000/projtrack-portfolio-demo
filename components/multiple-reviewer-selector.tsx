"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, X, User } from "lucide-react"
import { toast } from "react-hot-toast"

interface Personnel {
  id: string
  name: string
  position: string | null
  email: string | null
}

interface MultipleReviewerSelectorProps {
  authorizedReviewers: Personnel[]
  selectedReviewers: string[]
  onReviewersChangeAction: (reviewers: string[]) => void
  userEmail?: string
}

export function MultipleReviewerSelector({ 
  authorizedReviewers, 
  selectedReviewers, 
  onReviewersChangeAction,
  userEmail 
}: MultipleReviewerSelectorProps) {
  const [tempSelectedReviewer, setTempSelectedReviewer] = useState("")

  // Filter out already selected reviewers and current user
  const availableReviewers = authorizedReviewers.filter(reviewer => 
    !selectedReviewers.includes(reviewer.id) && 
    reviewer.email !== userEmail
  )

  const handleAddReviewer = () => {
    if (!tempSelectedReviewer) {
      toast.error("Please select a reviewer to add")
      return
    }

    if (selectedReviewers.includes(tempSelectedReviewer)) {
      toast.error("This reviewer is already selected")
      return
    }

    onReviewersChangeAction([...selectedReviewers, tempSelectedReviewer])
    setTempSelectedReviewer("")
    toast.success("Reviewer added successfully")
  }

  const handleRemoveReviewer = (reviewerId: string) => {
    onReviewersChangeAction(selectedReviewers.filter(id => id !== reviewerId))
    toast.success("Reviewer removed")
  }

  const getReviewerInfo = (reviewerId: string) => {
    return authorizedReviewers.find(reviewer => reviewer.id === reviewerId)
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-900 flex items-center">
        <User className="h-4 w-4 mr-2 text-gray-500" />
        Assign Reviewers *
        <span className="ml-2 text-xs text-gray-500">
          ({selectedReviewers.length} selected)
        </span>
      </Label>

      {/* Selected Reviewers */}
      {selectedReviewers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-medium">Selected Reviewers:</p>
          <div className="flex flex-wrap gap-2">
            {selectedReviewers.map((reviewerId) => {
              const reviewer = getReviewerInfo(reviewerId)
              if (!reviewer) return null
              
              return (
                <Badge 
                  key={reviewerId} 
                  variant="secondary" 
                  className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <span className="text-xs">
                    {reviewer.name} - {reviewer.position || 'Team Member'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-blue-100 ml-1"
                    onClick={() => handleRemoveReviewer(reviewerId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Add New Reviewer */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Select value={tempSelectedReviewer} onValueChange={setTempSelectedReviewer}>
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Select reviewer to add..." />
              </SelectTrigger>
              <SelectContent>
                {availableReviewers.length > 0 ? (
                  availableReviewers.map((reviewer) => (
                    <SelectItem key={reviewer.id} value={reviewer.id}>
                      {reviewer.name} - {reviewer.position || 'Team Member'}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    {selectedReviewers.length > 0 
                      ? "All available reviewers selected" 
                      : "No reviewers available"
                    }
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="px-3 h-10 text-blue-600 hover:bg-blue-50 border-blue-200"
          onClick={handleAddReviewer}
          disabled={!tempSelectedReviewer || availableReviewers.length === 0}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Minimum reviewer requirement */}
      {selectedReviewers.length === 0 && (
        <p className="text-xs text-red-500">
          At least one reviewer must be assigned to this report.
        </p>
      )}

      {/* Info message */}
      <p className="text-xs text-gray-500">
        You can assign multiple reviewers to this report. Each reviewer will be able to approve, request revision, or reject independently.
      </p>
    </div>
  )
}
