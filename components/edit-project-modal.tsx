"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Loader2, 
  Building2,
  User,
  Users,
  MapPin,
  FileText,
  Activity,
  X,
  Edit
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useUpdateProject } from "@/lib/hooks/useProjectsOptimized"
import type { Project } from "@/lib/supabase"
import { useModalMobileHide } from "@/lib/modal-mobile-utils"

const editProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255, "Name too long"),
  description: z.string().max(500, "Description too long (max 500 characters)").optional(),
  client: z.string().min(1, "Client name is required").max(255, "Client name too long"),
  location: z.string().min(1, "Location is required").max(255, "Location too long"),
  status: z.enum(["planning", "in-progress", "on-hold", "completed"]),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  team_size: z.number().min(1, "Team size must be at least 1").max(100, "Team size cannot exceed 100").optional(),
})

type EditProjectFormData = z.infer<typeof editProjectSchema>

interface LocationSuggestion {
  properties: {
    formatted: string
    name?: string
    city?: string
    country?: string
  }
}

interface EditProjectModalProps {
  readonly project: Project | null
  readonly open: boolean
  readonly onOpenChangeAction: (open: boolean) => void
  readonly onProjectUpdatedAction: () => void
}

export function EditProjectModal({ project, open, onOpenChangeAction, onProjectUpdatedAction }: EditProjectModalProps) {
  // Hide mobile header when modal is open
  useModalMobileHide(open)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const updateProjectMutation = useUpdateProject()
  const updateProject = updateProjectMutation.mutate

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
  })

  const startDate = watch("start_date")
  const endDate = watch("end_date")

  // Geoapify location search
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([])
      setShowLocationDropdown(false)
      return
    }

    setIsLoadingLocations(true)
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=dfa060e748234ad18917ceba6bf3cfb3&filter=countrycode:ph`,
        { method: 'GET' }
      )
      
      if (response.ok) {
        const result = await response.json()
        setLocationSuggestions(result.features || [])
        setShowLocationDropdown(true)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setIsLoadingLocations(false)
    }
  }

  // Handle location input change with debouncing
  const handleLocationChange = (value: string) => {
    setValue("location", value)
    
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current)
    }
    
    locationTimeoutRef.current = setTimeout(() => {
      searchLocations(value)
    }, 300)
  }

  // Handle location selection
  const handleLocationSelect = (location: LocationSuggestion) => {
    setValue("location", location.properties.formatted)
    setShowLocationDropdown(false)
    setLocationSuggestions([])
  }

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowLocationDropdown(false)
    }

    if (showLocationDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showLocationDropdown])

  // Populate form when project changes
  useEffect(() => {
    if (project && open) {
      reset({
        name: project.name,
        description: project.description || "",
        client: project.client || "",
        location: project.location || "",
        status: project.status as "planning" | "in-progress" | "on-hold" | "completed",
        start_date: project.start_date ? new Date(project.start_date) : undefined,
        end_date: project.end_date ? new Date(project.end_date) : undefined,
        team_size: project.team_size || undefined,
      })
    }
  }, [project, open, reset])

  const onSubmit = async (data: EditProjectFormData) => {
    if (!project) return
    
    try {
      setIsSubmitting(true)
      
      // Format dates in local timezone to avoid timezone conversion issues
      const formatDateToLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      const projectData = {
        ...data,
        start_date: data.start_date ? formatDateToLocal(data.start_date) : null,
        end_date: data.end_date ? formatDateToLocal(data.end_date) : null,
        description: data.description || null,
      }

      updateProject({
        id: project.id,
        updates: projectData
      })
      
      // Toast is handled in the hook
      onOpenChangeAction(false)
      onProjectUpdatedAction()
    } catch (error) {
      console.error("Error updating project:", error)
      // Don't call toast.error here - updateProject already shows error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] w-[95vw] sm:w-auto max-h-[85vh] sm:max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-xl">
        <DialogHeader className="space-y-1 sm:space-y-2 p-2 sm:p-3 border-b border-gray-100">
          <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 flex flex-col sm:flex-row items-center sm:items-start">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 shadow-lg">
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <span className="block">Edit Project</span>
              <span className="text-xs font-normal text-gray-600 block">Update project details</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 sm:space-y-3 p-2 sm:p-3">
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {/* Project Name */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                Project Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Assumption School Antipolo Sports Complex"
                  className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-gray-900 placeholder:text-gray-500 text-xs sm:text-sm"
                  maxLength={255}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Client and Location in grid on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {/* Client */}
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="client" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                  Client *
                </Label>
                <div className="relative">
                  <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    id="client"
                    {...register("client")}
                    placeholder="e.g., Assumption School Antipolo"
                    className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-gray-900 placeholder:text-gray-500 text-xs sm:text-sm"
                    maxLength={255}
                  />
                </div>
                {errors.client && (
                  <p className="text-xs text-red-500 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.client.message}
                  </p>
                )}
              </div>

              {/* Location with Geoapify Integration */}
              <div className="space-y-1 sm:space-y-2 relative">
                <Label htmlFor="location" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                  Location *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    id="location"
                    value={watch("location") || ""}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    placeholder="e.g., Antipolo City, Rizal"
                    className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-gray-900 placeholder:text-gray-500 text-xs sm:text-sm"
                    maxLength={255}
                    autoComplete="off"
                  />
                  {isLoadingLocations && (
                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Location Suggestions Dropdown */}
                {showLocationDropdown && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center"
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="text-xs text-gray-900 truncate">{suggestion.properties.formatted}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {errors.location && (
                  <p className="text-xs text-red-500 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description - Smaller on mobile */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
              Description
            </Label>
            <div className="relative">
              <FileText className="absolute left-2 sm:left-3 top-2 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Brief description of the electrical engineering project..."
                rows={2}
                maxLength={500}
                className="w-full pl-7 sm:pl-10 pt-2 sm:pt-3 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-gray-900 placeholder:text-gray-500 resize-none text-xs sm:text-sm"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {watch("description")?.length || 0}/500 characters
              </div>
            </div>
            {errors.description && (
              <p className="text-xs text-red-500 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Status and Team Size Row - Always in one row */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                Status
              </Label>
              <Select
                defaultValue={project?.status || undefined}
                onValueChange={(value) => setValue("status", value as "planning" | "in-progress" | "on-hold" | "completed")}
              >
                <SelectTrigger className="h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-xs sm:text-sm">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-xl">
                  <SelectItem value="planning" className="rounded-lg hover:bg-blue-50">
                    <div className="flex items-center py-0.5">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 mr-2 shadow-sm"></div>
                      <span className="font-medium text-xs sm:text-sm">Planning</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress" className="rounded-lg hover:bg-orange-50">
                    <div className="flex items-center py-0.5">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-orange-500 mr-2 shadow-sm"></div>
                      <span className="font-medium text-xs sm:text-sm">In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="on-hold" className="rounded-lg hover:bg-yellow-50">
                    <div className="flex items-center py-0.5">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500 mr-2 shadow-sm"></div>
                      <span className="font-medium text-xs sm:text-sm">On Hold</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed" className="rounded-lg hover:bg-green-50">
                    <div className="flex items-center py-0.5">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 mr-2 shadow-sm"></div>
                      <span className="font-medium text-xs sm:text-sm">Completed</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Size */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="team_size" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                Team Size
              </Label>
              <div className="relative">
                <Users className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="team_size"
                  type="number"
                  min="1"
                  max="100"
                  {...register("team_size", { valueAsNumber: true })}
                  placeholder="e.g., 5"
                  className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-gray-900 placeholder:text-gray-500 text-xs sm:text-sm"
                />
              </div>
              {errors.team_size && (
                <p className="text-xs text-red-500 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.team_size.message}
                </p>
              )}
            </div>
          </div>

          {/* Date Range - Always in one row */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-8 sm:h-10 justify-start text-left font-normal bg-white/80 border-gray-200 hover:border-blue-500 rounded-lg text-xs sm:text-sm",
                      !startDate && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => setValue("start_date", date)}
                    className="rounded-lg"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-8 sm:h-10 justify-start text-left font-normal bg-white/80 border-gray-200 hover:border-blue-500 rounded-lg text-xs sm:text-sm",
                      !endDate && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setValue("end_date", date)}
                    disabled={(date) => startDate ? date < startDate : false}
                    className="rounded-lg"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Form Actions - Smaller on mobile */}
          <div className="flex flex-row justify-end gap-2 pt-2 sm:pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChangeAction(false)}
              disabled={isSubmitting}
              className="h-8 sm:h-10 px-3 sm:px-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8 sm:h-10 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Update Project
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
