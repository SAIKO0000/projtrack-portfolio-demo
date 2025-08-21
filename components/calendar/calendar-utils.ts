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

// Utility function to format dates consistently in local timezone
export const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Utility function to check if two dates are the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateToLocal(date1) === formatDateToLocal(date2)
}

// Event type color utilities
export const getEventTypeColor = (type: string): string => {
  switch (type) {
    case "inspection":
      return "bg-blue-100 text-blue-800"
    case "delivery":
      return "bg-green-100 text-green-800"
    case "meeting":
      return "bg-orange-100 text-orange-800"
    case "training":
      return "bg-purple-100 text-purple-800"
    case "review":
      return "bg-yellow-100 text-yellow-800"
    case "task":
      return "bg-indigo-100 text-indigo-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getEventTypeDotColor = (type: string): string => {
  switch (type) {
    case "inspection":
      return "bg-blue-500"
    case "delivery":
      return "bg-green-500"
    case "meeting":
      return "bg-orange-500"
    case "training":
      return "bg-purple-500"
    case "review":
      return "bg-yellow-500"
    case "task":
      return "bg-indigo-500"
    default:
      return "bg-gray-500"
  }
}

// Date and calendar utilities
export const getDaysInMonth = (date: Date): (Date | null)[] => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days: (Date | null)[] = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }

  return days
}

export const getCurrentYear = (): number => new Date().getFullYear()

export const getYearRange = (): number[] => {
  const currentYear = getCurrentYear()
  const years: number[] = []
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i)
  }
  return years
}

export const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Helper function to get relative date description
export const getRelativeDateDescription = (eventDate: Date): string => {
  const today = new Date()
  const diffTime = eventDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Future dates
  if (diffDays > 0) {
    if (diffDays === 1) return "Tomorrow"
    if (diffDays <= 7) return `In ${diffDays} days`
    if (diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`
    if (diffDays <= 365) return `In ${Math.ceil(diffDays / 30)} months`
    return `In ${Math.ceil(diffDays / 365)} years`
  }
  
  // Past dates
  const pastDays = Math.abs(diffDays)
  if (pastDays === 1) return "Yesterday"
  if (pastDays <= 7) return `${pastDays} days ago`
  if (pastDays <= 30) return `${Math.ceil(pastDays / 7)} weeks ago`
  if (pastDays <= 365) return `${Math.ceil(pastDays / 30)} months ago`
  return `${Math.ceil(pastDays / 365)} years ago`
}

// Month names constant
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
