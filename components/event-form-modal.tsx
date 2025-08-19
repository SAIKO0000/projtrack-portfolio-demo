"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar-custom"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  CalendarIcon, 
  Plus, 
  Loader2, 
  Clock,
  MapPin,
  FileText,
  Users,
  X,
  CalendarPlus,
  Briefcase
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useEvents } from "@/lib/hooks/useEvents"
import { useProjects } from "@/lib/hooks/useProjects"
import { toast } from "react-hot-toast"
import { LocationAutocomplete } from "@/components/location-autocomplete"

const eventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(255, "Title too long"),
  description: z.string().optional(),
  date: z.date(),
  time: z.string().min(1, "Time is required"),
  type: z.enum(["inspection", "delivery", "meeting", "training", "review", "task"]),
  project_id: z.string().optional(),
  location: z.string().min(1, "Location is required").max(255, "Location too long"),
  attendees: z.array(z.string()),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventWithId extends EventFormData {
  id: string
}

interface EventFormModalProps {
  onEventCreated?: () => void
  selectedDate?: Date
  trigger?: React.ReactNode
  eventToEdit?: EventWithId // Event object when editing
  onEventUpdated?: () => void
}

export function EventFormModal({ onEventCreated, selectedDate, trigger, eventToEdit, onEventUpdated }: EventFormModalProps) {
  const [open, setOpen] = useState(!!eventToEdit) // Auto-open if editing
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendeeInput, setAttendeeInput] = useState("")
  const { createEvent, updateEvent } = useEvents()
  const { projects } = useProjects()
  
  const isEditing = !!eventToEdit
  
  // Auto-open when eventToEdit is provided
  useEffect(() => {
    if (eventToEdit) {
      setOpen(true)
    }
  }, [eventToEdit])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: eventToEdit?.type || "meeting",
      date: eventToEdit ? new Date(eventToEdit.date) : (selectedDate || new Date()),
      attendees: eventToEdit?.attendees || [],
      description: eventToEdit?.description || "",
      title: eventToEdit?.title || "",
      time: eventToEdit?.time || "",
      location: eventToEdit?.location || "",
      project_id: eventToEdit?.project_id || "",
    },
  })

  const eventDate = watch("date")
  const eventType = watch("type")
  const attendees = watch("attendees")
  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true)
      
      // Format date in local timezone to avoid timezone conversion issues
      const formatDateToLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
        const eventData = {
        ...data,
        date: formatDateToLocal(data.date),
        project_id: data.project_id || null,
        description: data.description || null,
        location: data.location || null,
        attendees: data.attendees || null,
        created_by: null, // Will be set when auth is implemented
      }

      if (isEditing && eventToEdit) {
        await updateEvent(eventToEdit.id, eventData)
        toast.success("Event updated successfully!")
        onEventUpdated?.()
      } else {
        await createEvent(eventData)
        toast.success("Event created successfully!")
        onEventCreated?.()
      }
      
      setOpen(false)
      reset()
      setAttendeeInput("")
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Failed to create event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addAttendee = () => {
    if (attendeeInput.trim() && !attendees.includes(attendeeInput.trim())) {
      setValue("attendees", [...attendees, attendeeInput.trim()])
      setAttendeeInput("")
    }
  }

  const removeAttendee = (attendee: string) => {
    setValue("attendees", attendees.filter(a => a !== attendee))
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "inspection": return "bg-blue-500"
      case "delivery": return "bg-green-500"
      case "meeting": return "bg-orange-500"
      case "training": return "bg-purple-500"
      case "review": return "bg-yellow-500"
      case "task": return "bg-indigo-500"
      default: return "bg-gray-500"
    }
  }

  const handleClose = (open: boolean) => {
    setOpen(open)
    if (!open && isEditing) {
      // If closing edit modal, call the callback to reset state
      onEventUpdated?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!isEditing && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-10 px-5 py-2">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl mx-4">
        <DialogHeader className="space-y-4 p-4 sm:p-6 border-b border-gray-100">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
              <CalendarPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <span className="block">{isEditing ? 'Edit Event' : 'Create New Event'}</span>
              <span className="text-xs sm:text-sm font-normal text-gray-600 block mt-1">
                {isEditing ? 'Update the event details below' : 'Schedule a new event for your project timeline'}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Title */}
            <div className="md:col-span-2 space-y-3">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-orange-500" />
                Event Title *
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="e.g., Site Inspection - CSA Makati"
                  className="w-full pl-12 h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-gray-900 placeholder:text-gray-500"
                />
              </div>
              {errors.title && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Event Type */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <div className={cn("w-4 h-4 rounded-full mr-2", getEventTypeColor(eventType))}></div>
                Event Type *
              </Label>
              <Select
                defaultValue="meeting"
                onValueChange={(value) => setValue("type", value as EventFormData["type"])}
              >
                <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspection">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      Inspection
                    </div>
                  </SelectItem>
                  <SelectItem value="delivery">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      Delivery
                    </div>
                  </SelectItem>
                  <SelectItem value="meeting">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                      Meeting
                    </div>
                  </SelectItem>
                  <SelectItem value="training">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                      Training
                    </div>
                  </SelectItem>
                  <SelectItem value="review">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      Review
                    </div>
                  </SelectItem>
                  <SelectItem value="task">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                      Task
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <Briefcase className="h-4 w-4 mr-2 text-orange-500" />
                Project (Optional)
              </Label>
              <Select onValueChange={(value) => setValue("project_id", value === "none" ? undefined : value)}>
                <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-orange-500" />
                Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal bg-white/80 border-gray-200 hover:border-orange-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl",
                      !eventDate && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-gray-400" />
                    {eventDate ? format(eventDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={(date) => setValue("date", date!)}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="time" className="text-sm font-semibold text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-orange-500" />
                Time *
              </Label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  {...register("time")}
                  className="w-full pl-12 h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-gray-900"
                />
              </div>
              {errors.time && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {errors.time.message}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label htmlFor="location" className="text-sm font-semibold text-gray-700 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-orange-500" />
              Location *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <LocationAutocomplete
                value={watch("location")}
                onChangeAction={(location) => setValue("location", location)}
                placeholder="Search for location (e.g., Makati City, Project Site)"
                className="w-full pl-12 h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-gray-900 placeholder:text-gray-500"
              />
            </div>
            {errors.location && (
              <p className="text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-orange-500" />
              Description
            </Label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Event details and additional notes..."
                rows={4}
                className="w-full pl-12 pt-4 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-gray-900 placeholder:text-gray-500 resize-none"
              />
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center">
              <Users className="h-4 w-4 mr-2 text-orange-500" />
              Attendees
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  placeholder="Add attendee name"
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                />
              </div>              <Button type="button" onClick={addAttendee} variant="outline" aria-label="Add attendee">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attendees.map((attendee, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{attendee}</span>                    <button
                      type="button"
                      onClick={() => removeAttendee(attendee)}
                      className="ml-2 text-orange-500 hover:text-orange-700"
                      aria-label={`Remove ${attendee}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="h-12 px-6 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating Event...' : 'Creating Event...'}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Event' : 'Create Event'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}