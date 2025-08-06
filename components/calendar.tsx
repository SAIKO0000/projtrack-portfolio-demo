"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Upload,
  ImageIcon,
  X,
  MoreHorizontal,
  Trash2,
  Download,
  Eye,
  ArrowRight,
  Edit,
} from "lucide-react"
import { EventFormModal } from "./event-form-modal"
import { DeleteEventDialog } from "./delete-event-dialog"
import { useEvents } from "@/lib/hooks/useEvents"
import { useProjects } from "@/lib/hooks/useProjects"
import { usePhotos } from "@/lib/hooks/usePhotos"
import { toast } from "react-hot-toast"

// Utility function to format dates consistently in local timezone
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Utility function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateToLocal(date1) === formatDateToLocal(date2)
}

export function Calendar() {  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const [deleteEventTitle, setDeleteEventTitle] = useState<string>("")
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [dayPhotos, setDayPhotos] = useState<any[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const { events, loading: eventsLoading, fetchEvents } = useEvents()
  const { projects, loading: projectsLoading } = useProjects()
  const { uploadPhotos, fetchPhotosForDate, getPhotoUrl, downloadPhoto, deletePhoto, uploading, uploadProgress } = usePhotos()

  // Reload photos when project filter changes and we have a selected day
  useEffect(() => {
    if (selectedDay && showDayModal) {
      loadDayPhotos(selectedDay)
    }
  }, [selectedProject])

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

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

  // Updated getEventsForDate function using local timezone
  const getEventsForDate = (date: Date | null) => {
    if (!date) return []
    const dateString = formatDateToLocal(date)
    return events.filter((event) => {
      const matchesDate = event.date === dateString
      const matchesProject = selectedProject === "all" || event.project_id === selectedProject
      return matchesDate && matchesProject
    })
  }

  const getEventTypeColor = (type: string) => {
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
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedDate(newDate)
  }

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(parseInt(monthIndex))
    setSelectedDate(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = new Date(selectedDate)
    newDate.setFullYear(parseInt(year))
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const getCurrentYear = () => new Date().getFullYear()
  const getYearRange = () => {
    const currentYear = getCurrentYear()
    const years = []
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i)
    }
    return years
  }
  const handleDayClick = (day: Date | null) => {
    if (day) {
      setSelectedDay(day)
      setShowDayModal(true)
      // Load photos for the selected day
      loadDayPhotos(day)
    }
  }
  const loadDayPhotos = async (day: Date) => {
    const dateString = formatDateToLocal(day)
    const photos = await fetchPhotosForDate(dateString)
    
    // Filter photos by selected project if not "all"
    const filteredPhotos = selectedProject === "all" 
      ? photos 
      : photos.filter(photo => photo.project_id === selectedProject)
    
    setDayPhotos(filteredPhotos)
  }

  const handleEventCreated = () => {
    fetchEvents() // Refresh events
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      setUploadFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadAll = async () => {
    if (!selectedDay || uploadFiles.length === 0) {
      toast.error("Please select files to upload")
      return
    }

    try {
      const dateString = formatDateToLocal(selectedDay)
      await uploadPhotos(uploadFiles, dateString, selectedProject !== "all" ? selectedProject : undefined)
      setUploadFiles([])
      await loadDayPhotos(selectedDay) // Refresh photos
      toast.success(`Successfully uploaded ${uploadFiles.length} photos`)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload photos")
    }
  }

  const handlePhotoView = (photo: any) => {
    setPhotoPreview(getPhotoUrl(photo.storage_path))
  }
  
  const handlePhotoDownload = async (photo: any) => {
    try {      await downloadPhoto(photo)
      toast.success("Photo downloaded successfully")
    } catch (error) {      console.error("Failed to download photo:", error)
      toast.error("Failed to download photo")
    }
  }

  const handlePhotoDelete = async (photo: any) => {
    // Add confirmation dialog
    if (!confirm(`Are you sure you want to delete "${photo.file_name}"?`)) {
      return
    }

    try {
      await deletePhoto(photo.id)
      
      // Refresh photos for the current day
      if (selectedDay) {
        await loadDayPhotos(selectedDay)
      }
      
      toast.success("Photo deleted successfully")
    } catch (error) {
      console.error("Failed to delete photo:", error)
      toast.error("Failed to delete photo")
    }
  }

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    setDeleteEventId(eventId)
    setDeleteEventTitle(eventTitle)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
  }

  const handleEventUpdated = () => {
    fetchEvents() // Refresh events
    setEditingEvent(null) // Close edit modal
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const days = getDaysInMonth(selectedDate)
    // Use the updated function for today's events
  const today = new Date()
  const todayEvents = getEventsForDate(today)
  
  const filteredEvents = events.filter((event) => 
    selectedProject === "all" || event.project_id === selectedProject
  )  // Function to get all upcoming events (excluding today)
  const getAllUpcomingEvents = () => {
    const todayString = formatDateToLocal(today)
    return events
      .filter((event) => {
        const eventDate = new Date(event.date + 'T00:00:00')
        const eventDateString = formatDateToLocal(eventDate)
        const matchesProject = selectedProject === "all" || event.project_id === selectedProject
        return eventDateString > todayString && matchesProject
      })
      .sort((a, b) => {
        // Sort by date first, then by time
        const dateA = new Date(a.date + 'T' + a.time)
        const dateB = new Date(b.date + 'T' + b.time)
        return dateA.getTime() - dateB.getTime()
      })
  }

  // Function to get all past events (excluding today)
  const getAllPastEvents = () => {
    const todayString = formatDateToLocal(today)
    return events
      .filter((event) => {
        const eventDate = new Date(event.date + 'T00:00:00')
        const eventDateString = formatDateToLocal(eventDate)
        const matchesProject = selectedProject === "all" || event.project_id === selectedProject
        return eventDateString < todayString && matchesProject
      })
      .sort((a, b) => {
        // Sort by date descending (most recent first), then by time
        const dateA = new Date(a.date + 'T' + a.time)
        const dateB = new Date(b.date + 'T' + b.time)
        return dateB.getTime() - dateA.getTime()
      })
  }

  // Function to navigate to a specific event's date
  const navigateToEventDate = (eventDate: string) => {
    const date = new Date(eventDate + 'T00:00:00')
    setSelectedDate(new Date(date.getFullYear(), date.getMonth(), 1)) // Set to first day of month for proper navigation
    setSelectedDay(date)
    setShowDayModal(true)
    loadDayPhotos(date)
  }
  // Helper function to get relative date description
  const getRelativeDateDescription = (eventDate: Date) => {
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

  const upcomingEvents = getAllUpcomingEvents()
  const pastEvents = getAllPastEvents()

  const selectedProjectName = projects.find((p) => p.id === selectedProject)?.name || "All Projects"

  if (eventsLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Schedule and track project activities</p>
        </div>
        <EventFormModal onEventCreated={handleEventCreated} />
      </div>

      {/* Project Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filter by Project:</span>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredEvents.length} events for {selectedProjectName}
            </div>
          </div>
        </CardContent>
      </Card>      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Select value={selectedDate.getMonth().toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>                    <SelectContent>
                      {monthNames.map((month, index) => (
                        <SelectItem key={month} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedDate.getFullYear().toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-[100px]">
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
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  Today
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-7 gap-1 p-1">
                {days.map((day, index) => {
                const dayEvents = day ? getEventsForDate(day) : []
                const isToday = day ? isSameDay(day, today) : false
                const isCurrentMonth = day ? day.getMonth() === selectedDate.getMonth() : false

                return (
                  <div
                    key={day ? formatDateToLocal(day) : `empty-${index}`}
                    className={`
                      min-h-[120px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200
                      hover:shadow-lg hover:-translate-y-1 hover:border-gray-300
                      ${isToday ? 'bg-orange-50 ring-2 ring-orange-200 shadow-md' : 'bg-white hover:bg-gray-50'}
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400 hover:bg-gray-100' : ''}
                    `}
                    onClick={() => handleDayClick(day)}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-orange-600' : ''}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
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
                      </>
                    )}
                  </div>                )
              })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar with Today's Events and Upcoming Events */}
        <div className="space-y-6">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-orange-500" />
                Today's Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No events today</p>
              ) : (                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {todayEvents.map((event) => {
                    const eventProject = projects.find(p => p.id === event.project_id)
                    
                    return (
                      <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            {eventProject && (
                              <p className="text-xs text-gray-500 mt-1">
                                {eventProject.name}
                              </p>
                            )}
                            <div className="flex items-center mt-1 text-xs text-gray-600">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(event.time)}
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                          </div>
                          <Badge variant="secondary" className={`text-xs ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  Upcoming Events
                </div>
                {upcomingEvents.length > 0 && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {upcomingEvents.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming events</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">                  {upcomingEvents.slice(0, 10).map((event) => {
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
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            {eventProject && (
                              <p className="text-xs text-gray-500 mt-1">
                                {eventProject.name}
                              </p>
                            )}
                            <div className="flex items-center mt-1 text-xs text-gray-600">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              <span 
                                className={`font-medium ${isThisWeek ? 'text-blue-700' : 'text-blue-600'}`}
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
                              className={`text-xs ${getEventTypeColor(event.type)} ${isThisWeek ? 'ring-2 ring-blue-200' : ''}`}
                            >
                              {event.type}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigateToEventDate(event.date)}
                              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title={`Go to ${eventDate.toLocaleDateString()}`}
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {upcomingEvents.length > 10 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">
                        +{upcomingEvents.length - 10} more events
                      </p>
                    </div>
                  )}
                </div>
              )}            </CardContent>
          </Card>

          {/* Past Events */}
          <Card>
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
                              onClick={() => navigateToEventDate(event.date)}
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
      </div>

      {/* Day Detail Modal */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {selectedDay && `${monthNames[selectedDay.getMonth()]} ${selectedDay.getDate()}, ${selectedDay.getFullYear()}`}
            </DialogTitle>
            <DialogDescription>
              Events and photos for this day
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Events Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Events</h3>
                <EventFormModal
                  selectedDate={selectedDay || undefined}
                  onEventCreated={handleEventCreated}
                  trigger={
                    <Button size="sm" variant="outline">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  }
                />
              </div>
              
              {selectedDay && getEventsForDate(selectedDay).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No events scheduled for this day</p>
              ) : (
                <div className="space-y-3">
                  {selectedDay && getEventsForDate(selectedDay).map((event) => (
                    <div key={event.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{event.title}</h4>
                            <Badge className={getEventTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {formatTime(event.time)}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {event.location}
                            </div>
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {event.attendees.length} attendees
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <p className="mt-2 text-sm text-gray-700">{event.description}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Photos Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Photos</h3>
                <div className="flex items-center space-x-2">                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Select photos to upload"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Photos
                  </Button>
                  {uploadFiles.length > 0 && (
                    <Button
                      size="sm"
                      onClick={handleUploadAll}
                      disabled={uploading}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading... ({Math.round(uploadProgress)}%)
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload All ({uploadFiles.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* File Queue */}
              {uploadFiles.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Files to Upload:</h4>
                  <div className="space-y-2">                    {uploadFiles.map((file, index) => (
                      <div key={`upload-${file.name}-${file.size}`} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}              {/* Uploaded Photos */}
              {dayPhotos.length === 0 && uploadFiles.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No photos uploaded for this day</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="border-dashed"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Photo
                  </Button>
                </div>
              ) : (                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dayPhotos.map((photo) => (
                    <div key={photo.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">                      <div className="relative group">
                        <img
                          src={getPhotoUrl(photo.storage_path)}
                          alt={photo.file_name}
                          className="w-full h-32 object-cover cursor-pointer hover:opacity-40 transition-opacity duration-300"
                          onClick={() => handlePhotoView(photo)}
                        />                        {/* Remove button - top right */}                        {/* Remove button - top right */}
                        <button
                          className="absolute top-2 right-2 z-20 h-8 w-8 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 rounded shadow-lg border border-gray-200 hover:border-red-300 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handlePhotoDelete(photo)
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          type="button"
                          title={`Delete ${photo.file_name}`}
                          aria-label={`Delete photo ${photo.file_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {/* View and Download buttons - center of image */}
                        <div className="absolute inset-0 flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-10 w-10 p-0 bg-white hover:bg-gray-200 text-gray-700 hover:text-gray-900 shadow-lg border border-gray-200 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePhotoView(photo)
                            }}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-10 w-10 p-0 bg-white hover:bg-gray-200 text-gray-700 hover:text-gray-900 shadow-lg border border-gray-200 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePhotoDownload(photo)
                            }}
                          >
                            <Download className="h-5 w-5" />
                          </Button>
                        </div>
                      </div><div className="p-2">
                        <p className="text-xs text-gray-600 truncate" title={photo.file_name}>
                          {photo.file_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(photo.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>      {/* Photo Preview Modal */}
      <Dialog open={!!photoPreview} onOpenChange={() => setPhotoPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {photoPreview && (
            <div className="flex justify-center">              <img
                src={photoPreview}
                alt="Selected photo preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>      {/* Edit Event Modal */}
      {editingEvent && (
        <EventFormModal
          eventToEdit={editingEvent}
          onEventUpdated={handleEventUpdated}
        />
      )}

      {/* Delete Event Dialog */}
      <DeleteEventDialog 
        eventId={deleteEventId || ""} 
        eventTitle={deleteEventTitle}
        open={!!deleteEventId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteEventId(null)
            setDeleteEventTitle("")
          }
        }}
        onEventDeleted={() => {
          handleEventCreated()
          setDeleteEventId(null)
          setDeleteEventTitle("")
        }}
      />
    </div>
  )
}
