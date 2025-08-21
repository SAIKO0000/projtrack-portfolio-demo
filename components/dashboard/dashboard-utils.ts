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

export const getStatusColor = (status: string) => {
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
}

export const getTaskStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "in-progress":
      return "bg-blue-100 text-blue-800"
    case "planning":
      return "bg-purple-100 text-purple-800"
    case "on-hold":
      return "bg-yellow-100 text-yellow-800"
    case "delayed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getStatusIndicatorColor = (statusName: string) => {
  switch (statusName) {
    case 'Completed':
      return 'bg-green-500'
    case 'In Progress':
      return 'bg-orange-500'
    case 'Planning':
      return 'bg-blue-500'
    case 'On Hold':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'No date'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export const formatTaskDate = (dateString: string | null) => {
  if (!dateString) return 'No due date'
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = taskDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
  if (diffDays <= 7) return `${diffDays} days`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
