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
  Building2,
  User,
  Users,
  MapPin,
  FileText,
  Activity,
  X,
  FolderPlus
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useCreateProject } from "@/lib/hooks/useProjectsOptimized"
import { toast } from "react-hot-toast"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255, "Name too long"),
  description: z.string().max(500, "Description too long (max 500 characters)").optional(),
  client: z.string().min(1, "Client name is required").max(255, "Client name too long"),
  location: z.string().min(1, "Location is required").max(255, "Location too long"),
  status: z.enum(["planning", "in-progress", "on-hold", "completed"]),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  progress: z.number().min(0).max(100),
  team_size: z.number().min(1, "Team size must be at least 1").max(100, "Team size cannot exceed 100").optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface LocationSuggestion {
  properties: {
    formatted: string
    name?: string
    city?: string
    country?: string
  }
}

interface ProjectFormModalProps {
  readonly onProjectCreated?: () => void
}

export function ProjectFormModal({ onProjectCreated }: ProjectFormModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const createProjectMutation = useCreateProject()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: "planning",
      progress: 0,
      team_size: 1,
    },
  })

  const startDate = watch("start_date")
  const endDate = watch("end_date")
  const locationValue = watch("location")

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
  
  const onSubmit = async (data: ProjectFormData) => {
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
        created_by: null,
        // Add missing optional fields
        actual_end_date: null,
        budget: null,
        category: null,
        priority: null,
        spent: null,
        team_size: data.team_size || null,
      }

      await createProjectMutation.mutateAsync(projectData)
      
      toast.success("Project created successfully!")
      setOpen(false)
      reset()
      onProjectCreated?.()
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-5 py-2 h-10">
          <Plus className="h-3 w-3 mr-2" />
          New Project
        </Button>
      </DialogTrigger>      
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl mx-4">
        <DialogHeader className="space-y-4 p-4 sm:p-6 border-b border-gray-100">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
              <FolderPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <span className="block">Create New Project</span>
              <span className="text-xs sm:text-sm font-normal text-gray-600 block mt-1">Add a new electrical engineering project to your portfolio</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div className="md:col-span-2 space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-orange-500" />
                Project Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Assumption School Antipolo Sports Complex"
                  className="w-full pl-12 h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-gray-900 placeholder:text-gray-500"
                  maxLength={255}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Client */}
            <div className="space-y-3">
              <Label htmlFor="client" className="text-sm font-semibold text-gray-700 flex items-center">
                <User className="h-4 w-4 mr-2 text-orange-500" />
                Client *
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="client"
                  {...register("client")}
                  placeholder="e.g., Assumption School Antipolo"
                  className="w-full pl-12 h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-gray-900 placeholder:text-gray-500"
                  maxLength={255}
                />
              </div>
              {errors.client && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {errors.client.message}
                </p>
              )}
            </div>

            {/* Location with Geoapify Integration */}
            <div className="space-y-3 relative">
              <Label htmlFor="location" className="text-sm font-semibold text-gray-700 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                Location *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  value={watch("location") || ""}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="e.g., Antipolo City, Rizal"
                  className="w-full pl-12 h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-gray-900 placeholder:text-gray-500"
                  maxLength={255}
                  autoComplete="off"
                />
                {isLoadingLocations && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Location Suggestions Dropdown */}
              {showLocationDropdown && locationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center"
                      onClick={() => handleLocationSelect(suggestion)}
                    >
                      <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-900 truncate">{suggestion.properties.formatted}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {errors.location && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {errors.location.message}
                </p>
              )}
            </div>
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
                placeholder="Brief description of the electrical engineering project..."
                rows={4}
                maxLength={500}
                className="w-full pl-12 pt-4 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-gray-900 placeholder:text-gray-500 resize-none"
              />
              <div className="absolute bottom-3 right-4 text-xs text-gray-500">
                {watch("description")?.length || 0}/500
              </div>
            </div>
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Status and Team Size Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <Activity className="h-4 w-4 mr-2 text-orange-500" />
                Status
              </Label>
              <Select
                defaultValue="planning"
                onValueChange={(value) => setValue("status", value as "planning" | "in-progress" | "on-hold" | "completed")}
              >
                <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      Planning
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                      In-Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="on-hold">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      On-Hold
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      Completed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Size */}
            <div className="space-y-3">
              <Label htmlFor="team_size" className="text-sm font-semibold text-gray-700 flex items-center">
                <Users className="h-4 w-4 mr-2 text-orange-500" />
                Team Size
              </Label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="team_size"
                  type="number"
                  min="1"
                  max="100"
                  {...register("team_size", { valueAsNumber: true })}
                  placeholder="e.g., 5"
                  className="w-full pl-12 h-12 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-gray-900 placeholder:text-gray-500"
                />
              </div>
              {errors.team_size && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {errors.team_size.message}
                </p>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-orange-500" />
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal bg-white/80 border-gray-200 hover:border-orange-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl",
                      !startDate && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-gray-400" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => setValue("start_date", date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-orange-500" />
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal bg-white/80 border-gray-200 hover:border-orange-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl",
                      !endDate && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-gray-400" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setValue("end_date", date)}
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
                  Creating Project...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}