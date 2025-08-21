"use client"

import { Users } from "lucide-react"

type TeamEmptyStateProps = {
  searchTerm: string
}

export function TeamEmptyState({ searchTerm }: TeamEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
      <p className="text-gray-500 mb-4 max-w-sm mx-auto">
        {searchTerm 
          ? "Try adjusting your search criteria to find team members" 
          : "Get started by adding your first team member"
        }
      </p>
    </div>
  )
}
