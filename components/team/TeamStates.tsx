"use client"

import { Button } from "@/components/ui/button"

export function TeamLoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading team members...</p>
      </div>
    </div>
  )
}

type TeamErrorStateProps = {
  error: string
}

export function TeamErrorState({ error }: TeamErrorStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-red-600 mb-4">Error loading team members: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  )
}
