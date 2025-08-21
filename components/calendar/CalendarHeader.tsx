import React from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, RefreshCw } from "lucide-react"
import { EventFormModal } from "../event-form-modal"
import type { CalendarHeaderProps } from "./types"

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  onRefresh,
  onEventCreated
}) => {
  return (
    <>
      {/* Modern Header with Glassmorphism */}
      <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 lg:p-7 rounded-xl shadow-lg border border-gray-200/50">
        {/* Mobile Layout: Title and description centered */}
        <div className="lg:hidden text-center mb-4">
          <div className="flex items-center gap-3 justify-center mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          </div>
          <p className="text-base text-gray-600">Schedule and track project activities</p>
          <div className="flex justify-center mt-3">
            <Button
              variant="outline"
              size="default"
              onClick={onRefresh}
              className="flex items-center gap-2 h-10 px-5 py-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Desktop Layout: Enhanced header */}
        <div className="hidden lg:flex items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900">Calendar</h1>
                <p className="text-base lg:text-lg text-gray-600 mt-1">Schedule and track project activities</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="default"
              onClick={onRefresh}
              className="flex items-center gap-2 h-10 px-5 py-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <EventFormModal onEventCreated={onEventCreated} />
          </div>
        </div>
      </div>
    </>
  )
}
