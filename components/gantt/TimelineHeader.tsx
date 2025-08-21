"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { ViewMode, TimelineMonth } from "./types"
import { TaskFormModal } from "./TaskFormModal"

interface Project {
  id: string
  name: string
}

interface TimelineHeaderProps {
  viewMode: ViewMode
  currentPeriod: Date
  projectFilter: string
  projects: Project[]
  filteredTasksLength: number
  onNavigatePeriodAction: (direction: "prev" | "next") => void
  onTaskCreatedAction: () => void
  timelineMonths: TimelineMonth[]
  isExpanded?: boolean
  onToggleExpandAction?: () => void
}

export function TimelineHeader({
  viewMode,
  currentPeriod,
  projectFilter,
  projects,
  filteredTasksLength,
  onNavigatePeriodAction,
  onTaskCreatedAction,
  timelineMonths,
  isExpanded = true,
  onToggleExpandAction
}: TimelineHeaderProps) {
  const getTimelineTitle = () => {
    if (projectFilter !== "all") {
      return `${projects.find(p => p.id === projectFilter)?.name || 'Unknown Project'} Timeline`
    }
    
    switch (viewMode) {
      case "daily":
        return `Daily - ${currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
      case "weekly":
        return `Weekly - ${currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
      case "monthly":
        return `Monthly - ${currentPeriod.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`
      default:
        return "Full Timeline"
    }
  }

  const handleTodayClick = () => {
    // Get current date in Philippines timezone properly
    const now = new Date()
    const philippinesOffset = 8 * 60 // Philippines is UTC+8
    const localOffset = now.getTimezoneOffset()
    const philippinesTime = new Date(now.getTime() + (localOffset + philippinesOffset) * 60000)
    // This will trigger navigation in parent component
    window.dispatchEvent(new CustomEvent('navigate-to-today', { detail: philippinesTime }))
  }

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3 min-w-0">
            <CardTitle className="dark:text-white text-sm sm:text-lg truncate">
              {getTimelineTitle()}
            </CardTitle>
            <Badge variant="outline" className="text-xs w-fit">
              {filteredTasksLength} tasks
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* Expand/Collapse Controls */}
            {onToggleExpandAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleExpandAction}
                className="h-8 px-2 sm:h-10 sm:px-3 text-xs sm:text-sm"
                title={isExpanded ? "Collapse All" : "Expand All"}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Expand All
                  </>
                )}
              </Button>
            )}
            
            {/* Desktop Add Task Button */}
            <div className="hidden sm:block">
              <TaskFormModal 
                onTaskCreated={onTaskCreatedAction} 
                defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
              />
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {viewMode !== "full" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigatePeriodAction("prev")}
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTodayClick}
                    className="h-8 px-2 sm:h-10 sm:px-3 text-xs sm:text-sm"
                    title="Go to current period (Philippines time)"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigatePeriodAction("next")}
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6">
        {/* Timeline Headers */}
        <TimelineHeaders viewMode={viewMode} currentPeriod={currentPeriod} timelineMonths={timelineMonths} />
        
        {/* Mobile Timeline Header */}
        <div className="sm:hidden mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {viewMode === "daily" 
                ? currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                : viewMode === "weekly"
                  ? `Week of ${currentPeriod.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
                  : viewMode === "monthly"
                    ? currentPeriod.toLocaleDateString("en-PH", { month: "long", year: "numeric" })
                    : "Timeline Overview"
              }
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {filteredTasksLength} task{filteredTasksLength !== 1 ? 's' : ''}
            </div>
            {/* Mobile Add Task Button */}
            <div className="mt-2">
              <TaskFormModal 
                onTaskCreated={onTaskCreatedAction} 
                defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Separate component for timeline headers
function TimelineHeaders({ viewMode, currentPeriod, timelineMonths }: {
  viewMode: ViewMode
  currentPeriod: Date
  timelineMonths: TimelineMonth[]
}) {
  return (
    <>
      {/* Timeline Header - Desktop */}
      <div className="hidden sm:grid grid-cols-12 gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="col-span-4 text-sm font-medium text-gray-600 dark:text-gray-400">Task Details</div>
        <div className="col-span-8">
          {viewMode === "daily" ? (
            <>
              <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                Daily View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric", month: "long" })}
              </div>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-14 gap-1 min-w-max" style={{ minWidth: '800px' }}>
                  {timelineMonths.map((day, index) => (
                    <div key={day.label + index} className={`text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 ${
                      index < timelineMonths.length - 1 ? 'border-r border-gray-400 dark:border-gray-500' : ''
                    }`} style={{ minWidth: '55px' }}>
                      <div className="truncate">{day.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : viewMode === "weekly" ? (
            <>
              <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                Weekly View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric", month: "long" })}
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max" style={{ minWidth: '600px' }}>
                  {timelineMonths.map((week, index) => (
                    <div key={week.label + index} className={`text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 ${
                      index < timelineMonths.length - 1 ? 'border-r border-gray-400 dark:border-gray-500' : ''
                    }`} style={{ minWidth: '140px', flex: '1' }}>
                      <div className="truncate">{week.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : viewMode === "monthly" ? (
            <>
              <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                Monthly View - {currentPeriod.toLocaleDateString("en-PH", { year: "numeric" })}
              </div>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-6 gap-1 min-w-max" style={{ minWidth: '720px' }}>
                  {timelineMonths.map((month, index) => (
                    <div key={month.label + index} className={`text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-2 py-1 ${
                      index < timelineMonths.length - 1 ? 'border-r border-gray-400 dark:border-gray-500' : ''
                    }`} style={{ minWidth: '120px' }}>
                      <div className="truncate">{month.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                Full Timeline View
                <span className="text-xs font-normal text-gray-500 ml-2">
                  ({timelineMonths.length > 0 ? `${timelineMonths[0].year} - ${timelineMonths[timelineMonths.length - 1].year}` : ''})
                </span>
              </div>

              {timelineMonths.length > 0 && (
                <div className="overflow-x-auto">
                  {/* Year headers */}
                  <div 
                    className="grid gap-1 mb-1 min-w-max" 
                    style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, minmax(60px, 1fr))`, minWidth: `${timelineMonths.length * 60}px` }}
                  >
                    {timelineMonths.reduce((acc: React.ReactElement[], month, index) => {
                      // Show year only at the start of each new year or first month
                      const showYear = index === 0 || month.year !== timelineMonths[index - 1].year;
                      if (showYear) {
                        const yearSpan = timelineMonths.filter(m => m.year === month.year).length;
                        acc.push(
                          <div 
                            key={`year-${month.year}`} 
                            className="text-xs text-center text-gray-700 dark:text-gray-300 font-bold border-r-2 border-gray-500 dark:border-gray-400 py-1"
                            style={{ gridColumn: `span ${yearSpan}` }}
                          >
                            {month.year}
                          </div>
                        );
                      }
                      return acc;
                    }, [])}
                  </div>
                  
                  {/* Month/Quarter headers */}
                  <div 
                    className="grid gap-1 mb-1 min-w-max" 
                    style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, minmax(60px, 1fr))`, minWidth: `${timelineMonths.length * 60}px` }}
                  >
                    {timelineMonths.map((month, index) => (
                      <div 
                        key={month.label + month.date.getFullYear()} 
                        className={`text-xs text-center text-gray-600 dark:text-gray-400 font-medium px-1 py-1 ${
                          index < timelineMonths.length - 1 ? 'border-r border-gray-400 dark:border-gray-500' : ''
                        }`}
                      >
                        <div className="truncate" title={month.label}>{month.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Grid lines for spacing */}
      <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-gray-400 dark:text-gray-500">
        <div className="col-span-4"></div>
        <div className="col-span-8">
          {viewMode === "daily" ? (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-14 gap-1 min-w-max" style={{ minWidth: '800px' }}>
                {timelineMonths.map((day, index) => (
                  <div key={day.label + index} className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30" style={{ minWidth: '55px' }}></div>
                ))}
              </div>
            </div>
          ) : viewMode === "weekly" ? (
            <div className="overflow-x-auto">
              <div className="flex gap-1 min-w-max" style={{ minWidth: '600px' }}>
                {timelineMonths.map((week, index) => (
                  <div key={week.label + index} className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30" style={{ minWidth: '140px', flex: '1' }}></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div 
                className="grid gap-1 min-w-max"
                style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, minmax(60px, 1fr))`, minWidth: `${timelineMonths.length * 60}px` }}
              >
                {timelineMonths.map((_, index) => (
                  <div key={index} className="h-4 border-l border-gray-300 dark:border-gray-600 opacity-30"></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
