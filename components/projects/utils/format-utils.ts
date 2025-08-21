import { useCallback } from "react"

// Capitalize first letter of each word for formal display
export const useCapitalizeWords = () => {
  return useCallback((text: string | null | undefined): string => {
    if (!text) return "Unknown"
    return text
      .replace(/-/g, " ") // Replace hyphens with spaces
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }, [])
}

// Get report status color
export const useGetReportStatusColor = () => {
  return useCallback((status: string | null) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "revision":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
      default:
        return "bg-gray-100 text-gray-800"
    }
  }, [])
}

export const useGetStatusColor = () => {
  return useCallback((status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800"
    
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-orange-100 text-orange-800"
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "on-hold":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }, [])
}

export const useFormatDate = () => {
  return useCallback((dateString: string | null) => {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }, [])
}
