import { EnhancedTask, TimelineMonth, ViewMode } from "./types"

// Get full timeline range
export const getFullTimelineRange = (enhancedTasks: EnhancedTask[]) => {
  if (enhancedTasks.length === 0) {
    return { start: new Date(), end: new Date() }
  }

  const tasksWithDates = enhancedTasks.filter(t => t.start_date && t.end_date)
  if (tasksWithDates.length === 0) {
    return { start: new Date(), end: new Date() }
  }

  const startDates = tasksWithDates.map((t) => new Date(t.start_date!))
  const endDates = tasksWithDates.map((t) => new Date(t.end_date!))

  const earliestStart = new Date(Math.min(...startDates.map((d) => d.getTime())))
  const latestEnd = new Date(Math.max(...endDates.map((d) => d.getTime())))

  return { start: earliestStart, end: latestEnd }
}

// Generate timeline months based on view mode
export const getTimelineMonths = (
  viewMode: ViewMode,
  currentPeriod: Date,
  enhancedTasks: EnhancedTask[]
): TimelineMonth[] => {
  const months = []

  if (viewMode === "full") {
    const { start, end } = getFullTimelineRange(enhancedTasks)
    const startDate = new Date(start.getFullYear(), start.getMonth(), 1)
    const endDate = new Date(end.getFullYear(), end.getMonth() + 1, 0)

    const currentDate = new Date(startDate)
    const totalMonths =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1

    // Dynamic granularity based on timeline length
    if (totalMonths > 24) {
      // For very long timelines (2+ years), show quarters only
      const startQuarter = Math.floor(startDate.getMonth() / 3)
      const startYear = startDate.getFullYear()
      const endQuarter = Math.floor(endDate.getMonth() / 3)
      const endYear = endDate.getFullYear()

      let currentYear = startYear
      let currentQuarter = startQuarter

      while (currentYear < endYear || (currentYear === endYear && currentQuarter <= endQuarter)) {
        const quarterStartMonth = currentQuarter * 3
        const quarterEndMonth = quarterStartMonth + 2
        const quarterStart = new Date(currentYear, quarterStartMonth, 1)
        const quarterEnd = new Date(currentYear, quarterEndMonth + 1, 0)

        months.push({
          label: `Q${currentQuarter + 1}`,
          date: new Date(quarterStart),
          endDate: new Date(quarterEnd),
          quarter: currentQuarter + 1,
          year: currentYear,
          isQuarter: true,
        })

        currentQuarter++
        if (currentQuarter > 3) {
          currentQuarter = 0
          currentYear++
        }
      }
    } else if (totalMonths > 12) {
      // For medium timelines (1-2 years), show bi-monthly
      while (currentDate <= endDate) {
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)
        const actualEndDate = monthEnd > endDate ? endDate : monthEnd

        months.push({
          label: `${currentDate.toLocaleDateString("en-US", { month: "short" })}-${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toLocaleDateString("en-US", { month: "short" })}`,
          date: new Date(currentDate),
          endDate: new Date(actualEndDate),
          quarter: Math.floor(currentDate.getMonth() / 3) + 1,
          year: currentDate.getFullYear(),
          isQuarter: false,
        })

        currentDate.setMonth(currentDate.getMonth() + 2)
      }
    } else {
      // For shorter timelines (≤1 year), show monthly
      while (currentDate <= endDate) {
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        months.push({
          label: currentDate.toLocaleDateString("en-US", { month: "short" }),
          date: new Date(currentDate),
          endDate: new Date(monthEnd),
          quarter: Math.floor(currentDate.getMonth() / 3) + 1,
          year: currentDate.getFullYear(),
          isQuarter: false,
        })

        currentDate.setMonth(currentDate.getMonth() + 1)
      }
    }
  } else if (viewMode === "monthly") {
    // Monthly view - show 6 months around current period
    const startDate = new Date(currentPeriod.getFullYear(), currentPeriod.getMonth() - 2, 1)
    
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
      const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)
      
      months.push({
        label: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        date: new Date(monthStart),
        endDate: new Date(monthEnd),
        quarter: Math.floor(monthStart.getMonth() / 3) + 1,
        year: monthStart.getFullYear(),
        isQuarter: false,
      })
    }
  } else if (viewMode === "yearly") {
    // Yearly view - show 5 years around current period
    const startYear = currentPeriod.getFullYear() - 2
    
    for (let i = 0; i < 5; i++) {
      const year = startYear + i
      const yearStart = new Date(year, 0, 1) // January 1st
      const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999) // December 31st
      
      months.push({
        label: year.toString(),
        date: new Date(yearStart),
        endDate: new Date(yearEnd),
        quarter: 1,
        year: year,
        isQuarter: false,
      })
    }
  } else if (viewMode === "daily") {
    // Daily view - show 7 days (1 week) on mobile, 14 days (2 weeks) on desktop
    // For simplicity, we'll default to 7 days to ensure mobile compatibility
    const daysToShow = 7 // Reduced from 14 to prevent mobile overflow
    const startDate = new Date(currentPeriod)
    startDate.setDate(startDate.getDate() - Math.floor(daysToShow / 2)) // Center around current date
    startDate.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < daysToShow; i++) {
      const dayDate = new Date(startDate)
      dayDate.setDate(startDate.getDate() + i)
      
      months.push({
        label: dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        date: new Date(dayDate),
        endDate: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59),
        quarter: 1,
        year: dayDate.getFullYear(),
        isQuarter: false,
      })
    }
  }

  return months
}

// Navigate to next/previous period
export const navigatePeriod = (
  direction: "prev" | "next",
  viewMode: ViewMode,
  currentPeriod: Date
): Date => {
  const newPeriod = new Date(currentPeriod)
  
  if (viewMode === "daily") {
    newPeriod.setDate(newPeriod.getDate() + (direction === "next" ? 1 : -1))
  } else if (viewMode === "monthly") {
    // Navigate by 1 month to show the next/previous month
    newPeriod.setMonth(newPeriod.getMonth() + (direction === "next" ? 1 : -1))
  } else if (viewMode === "yearly") {
    // Navigate by 1 year to show the next/previous year
    newPeriod.setFullYear(newPeriod.getFullYear() + (direction === "next" ? 1 : -1))
  }
  // For "full" mode, navigation is not applicable as it shows entire timeline
  
  return newPeriod
}
