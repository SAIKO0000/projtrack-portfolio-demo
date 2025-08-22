"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"
import { useModalMobileHide } from "@/lib/modal-mobile-utils"

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName?: string
  isLoading?: boolean
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false
}: DeleteConfirmationDialogProps) {
  // Hide mobile header when modal is open
  useModalMobileHide(isOpen)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] max-w-[95vw] w-[95vw] sm:w-auto p-0 overflow-hidden rounded-2xl shadow-2xl border-0">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 sm:p-6 border-b border-red-100">
          <DialogHeader className="text-center space-y-3 sm:space-y-4">
            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                {title}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {description}
              </DialogDescription>
            </div>
            {itemName && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-red-200/50 shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Item to be deleted:</p>
                <p className="font-semibold text-gray-900 text-sm sm:text-lg break-words">
                  &ldquo;{itemName}&rdquo;
                </p>
              </div>
            )}
          </DialogHeader>
        </div>
        
        <div className="p-4 sm:p-6 bg-white">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-yellow-800 mb-1">
                  Warning: This action cannot be undone
                </h4>
                <p className="text-xs sm:text-sm text-yellow-700">
                  This will permanently delete the item and all associated data.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto h-9 sm:h-11 text-xs sm:text-sm font-medium border-gray-300 hover:bg-gray-50 focus:ring-gray-500/20 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto h-9 sm:h-11 text-xs sm:text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Delete Permanently</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
