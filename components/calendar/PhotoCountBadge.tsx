import React from "react"
import { ImageIcon } from "lucide-react"
import { formatDateToLocal } from "./calendar-utils"
import type { PhotoCountBadgeProps } from "./types"

// Optimized Photo count badge component - uses cached data
export const PhotoCountBadge: React.FC<PhotoCountBadgeProps> = ({ date, photoCounts }) => {
  const dateString = formatDateToLocal(date)
  const photoCount = photoCounts[dateString] || 0
  
  if (photoCount === 0) return null
  
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 bg-blue-500 text-white rounded-full px-1 sm:px-1.5 py-0.5 text-xs">
      <ImageIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
      <span className="text-xs sm:text-xs">{photoCount}</span>
    </div>
  )
}
