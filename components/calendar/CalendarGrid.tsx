import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PhotoCountBadge } from "./PhotoCountBadge"
import { isSameDay } from "./calendar-utils"
import type { CalendarGridProps } from "./types"

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  selectedDate,
  today,
  monthNames,
  photoCounts,
  getEventsForDate,
  getEventTypeColor,
  getEventTypeDotColor,
  getYearRange,
  onDayClick,
  onNavigateMonth,
  onMonthChange,
  onYearChange,
  onGoToToday
}) => {
  return (
    <Card className="lg:col-span-3 order-1 lg:order-1 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50" style={{ zIndex: 1 }}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
            {/* Navigation arrows and dropdowns aligned together */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateMonth("prev")}
                className="h-8 sm:h-10 w-8 sm:w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select value={selectedDate.getMonth().toString()} onValueChange={onMonthChange}>
                <SelectTrigger className="w-[110px] sm:w-[130px] h-8 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDate.getFullYear().toString()} onValueChange={onYearChange}>
                <SelectTrigger className="w-[80px] sm:w-[100px] h-8 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getYearRange().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateMonth("next")}
                className="h-8 sm:h-10 w-8 sm:w-10 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={onGoToToday}
              className="text-orange-600 border-orange-200 hover:bg-orange-50 h-8 sm:h-12 px-3 sm:px-6 text-xs sm:text-sm"
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile-responsive day headers */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-4">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div key={`day-header-${index}`} className="p-1 sm:p-2 text-center text-sm sm:text-sm font-medium text-gray-500 min-h-[32px] sm:min-h-[40px] flex items-center justify-center">
              <span className="sm:hidden text-xs font-semibold">{day}</span>
              <span className="hidden sm:inline">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index]}
              </span>
            </div>
          ))}
        </div>
        
        {/* Mobile-responsive calendar grid */}
        <div className="bg-gray-50 p-1 sm:p-2 md:p-3 rounded-lg mx-0">
          <div className="grid grid-cols-7 gap-1 sm:gap-1 md:gap-2">
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : []
              const isToday = day ? isSameDay(day, today) : false
              const isCurrentMonth = day ? day.getMonth() === selectedDate.getMonth() : false

              return (
                <div
                  key={day ? day.toISOString() : `empty-${index}`}
                  className={`
                    min-h-[60px] sm:min-h-[120px] aspect-square sm:aspect-auto w-full p-1 sm:p-2 border border-gray-200 rounded-md sm:rounded-lg cursor-pointer transition-all duration-200
                    hover:shadow-lg hover:-translate-y-1 hover:border-gray-300 touch-manipulation
                    ${isToday ? 'bg-orange-50 ring-1 sm:ring-2 ring-orange-200 shadow-md' : 'bg-white hover:bg-gray-50'}
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400 hover:bg-gray-100' : ''}
                  `}
                  onClick={() => onDayClick(day)}
                >
                  {day && (
                    <>
                      <div className="flex justify-between items-start mb-1">
                        <div className={`text-sm sm:text-sm md:text-base font-semibold sm:font-medium ${isToday ? 'text-orange-600' : ''}`}>
                          {day.getDate()}
                        </div>
                        <PhotoCountBadge date={day} photoCounts={photoCounts} />
                      </div>
                      
                      {/* Mobile-optimized event display */}
                      <div className="space-y-0.5 sm:space-y-1 h-full flex flex-col justify-start">
                        {/* On mobile: Show dots for events, on desktop: Show event titles */}
                        <div className="sm:hidden">
                          {dayEvents.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 justify-start">
                              {dayEvents.slice(0, 3).map((event) => (
                                <div
                                  key={`dot-${event.id}`}
                                  className={`w-1.5 h-1.5 rounded-full ${getEventTypeDotColor(event.type)}`}
                                  title={event.title}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="text-[9px] text-gray-500 ml-1 leading-none">
                                  +{dayEvents.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Desktop: Show event titles */}
                        <div className="hidden sm:block">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate ${getEventTypeColor(event.type)}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
