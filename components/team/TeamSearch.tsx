"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type TeamSearchProps = {
  searchTerm: string
  onSearchChangeAction: (term: string) => void
}

export function TeamSearch({ searchTerm, onSearchChangeAction }: TeamSearchProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200/50">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search team members..."
          value={searchTerm}
          onChange={(e) => onSearchChangeAction(e.target.value)}
          className="pl-10 h-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 bg-white shadow-sm"
        />
      </div>
    </div>
  )
}
