// Add throttling utility
export const createThrottledFunction = <T extends unknown[]>(func: (...args: T) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  
  return (...args: T) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

// Capitalize first letter of each word for formal display
export const capitalizeWords = (text: string | null | undefined): string => {
  if (!text) return "Unknown"
  return text
    .replace(/-/g, " ") // Replace hyphens with spaces
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export const getStatusColor = (status: string = "pending") => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "revision":
      return "bg-orange-100 text-orange-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getCategoryColor = (category: string = "Progress Report") => {
  switch (category) {
    case "Progress Report":
      return "bg-blue-100 text-blue-800"
    case "Safety Report":
      return "bg-red-100 text-red-800"
    case "Completion Report":
      return "bg-green-100 text-green-800"
    case "Site Photos":
      return "bg-purple-100 text-purple-800"
    case "Technical Drawing":
      return "bg-indigo-100 text-indigo-800"
    case "Material List":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const formatDate = (dateString: string | null) => {
  if (!dateString) return "Unknown"
  return new Date(dateString).toLocaleDateString()
}
