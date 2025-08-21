import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Clock, MapPin, ArrowRight } from "lucide-react"
import type { CalendarSidebarProps } from "./types"

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  today,
  todayEvents,
  upcomingEvents,
  pastEvents,
  projects,
  formatTime,
  getEventTypeColor,
  getRelativeDateDescription,
  onNavigateToEventDate
}) => {
  return (
    <div className="space-y-4 order-2 lg:order-2">
      {/* Today's Events - Collapsible on mobile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-orange-500" />
            Today&apos;s Events
            <Badge variant="secondary" className="ml-auto text-xs bg-orange-100 text-orange-700">
              {todayEvents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {todayEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No events today</p>
          ) : (
            <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
              {todayEvents.map((event) => {
                const eventProject = projects.find(p => p.id === event.project_id)
                
                return (
                  <div key={event.id} className="p-2 bg-gray-50 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs truncate">{event.title}</h4>
                        {eventProject && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {eventProject.name}
                          </p>
                        )}
                        <div className="flex items-center mt-0.5 text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{formatTime(event.time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center mt-0.5 text-xs text-gray-600">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className={`text-[10px] sm:text-xs ml-2 flex-shrink-0 ${getEventTypeColor(event.type)}`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events - Mobile optimized */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-500" />
              <span className="hidden sm:inline">Upcoming Events</span>
              <span className="sm:hidden">Upcoming</span>
            </div>
            {upcomingEvents.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                {upcomingEvents.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming events</p>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-40 sm:max-h-48 overflow-y-auto">
              {upcomingEvents.slice(0, 8).map((event) => {
                const eventDate = new Date(event.date + 'T00:00:00')
                const isThisWeek = (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 7
                const relativeDate = getRelativeDateDescription(eventDate)
                const eventProject = projects.find(p => p.id === event.project_id)
                
                return (
                  <div key={event.id} className={`p-2 rounded-lg transition-colors border-l-4 ${
                    isThisWeek 
                      ? 'bg-blue-50 hover:bg-blue-100 border-l-blue-400' 
                      : 'bg-gray-50 hover:bg-gray-100 border-l-gray-300'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs sm:text-sm truncate">{event.title}</h4>
                        {eventProject && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {eventProject.name}
                          </p>
                        )}
                        <div className="flex items-center mt-1 text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className={`font-medium truncate ${isThisWeek ? 'text-blue-700' : 'text-blue-600'}`}>
                            {relativeDate}
                          </span>
                          <span className="mx-1 hidden sm:inline">•</span>
                          <span className="hidden sm:inline truncate">
                            {eventDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: eventDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                            })}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{formatTime(event.time)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1 ml-2 flex-shrink-0">
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] sm:text-xs ${getEventTypeColor(event.type)} ${isThisWeek ? 'ring-2 ring-blue-200' : ''}`}
                        >
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigateToEventDate(event.date)}
                          className="h-5 sm:h-6 w-5 sm:w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title={`Go to ${eventDate.toLocaleDateString()}`}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {upcomingEvents.length > 8 && (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500">
                    +{upcomingEvents.length - 8} more events
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Events */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gray-500" />
              Past Events
            </div>
            {pastEvents.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                {pastEvents.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No past events</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {pastEvents.slice(0, 10).map((event) => {
                const eventDate = new Date(event.date + 'T00:00:00')
                const relativeDate = getRelativeDateDescription(eventDate)
                const eventProject = projects.find(p => p.id === event.project_id)
                
                return (
                  <div key={event.id} className="p-2 rounded-lg transition-colors border-l-4 bg-gray-50 hover:bg-gray-100 border-l-gray-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                        {eventProject && (
                          <p className="text-xs text-gray-500 mt-1">
                            {eventProject.name}
                          </p>
                        )}
                        <div className="flex items-center mt-1 text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          <span 
                            className="font-medium text-gray-600"
                            title={`Exact date: ${eventDate.toLocaleDateString()}`}
                          >
                            {relativeDate}
                          </span>
                          <span className="mx-1">•</span>
                          {eventDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: eventDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                          })}
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(event.time)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getEventTypeColor(event.type)} opacity-75`}
                        >
                          {event.type}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigateToEventDate(event.date)}
                          className="h-6 px-2 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                          title={`Go to ${eventDate.toLocaleDateString()}`}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {pastEvents.length > 10 && (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500">
                    +{pastEvents.length - 10} more events
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
