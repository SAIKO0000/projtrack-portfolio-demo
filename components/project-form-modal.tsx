"use client"

import { useState } from "react"
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
import { useProjects } from "@/lib/hooks/useProjects"
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

interface ProjectFormModalProps {
  readonly onProjectCreated?: () => void
}

export function ProjectFormModal({ onProjectCreated }: ProjectFormModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createProject } = useProjects()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: "planning",
      progress: 0,
      team_size: 1,
    },
  })
  const startDate = watch("start_date")
  const endDate = watch("end_date")
  
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

      await createProject(projectData)
      
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
        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto break-words">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center break-words">
            <div className="w-10 h-10 rounded-lg bg-orange-90 flex items-center justify-center mr-3 shadow-sm flex-shrink-0">
              <FolderPlus className="h-5 w-5 text-black-500" />
            </div>
            <span className="break-words">Create New Project</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 ml-13 break-words">
            Add a new electrical engineering project to your portfolio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-gray-500" />
              Project Name *
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Assumption School Antipolo Sports Complex"
                className="w-full pl-10 overflow-hidden text-ellipsis"
                maxLength={255}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-medium text-gray-700 flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              Client *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />              <Input
                id="client"
                {...register("client")}
                placeholder="e.g., Assumption School Antipolo"
                className="w-full pl-10 overflow-hidden text-ellipsis"
                maxLength={255}
              />
            </div>
            {errors.client && (
              <p className="text-sm text-red-600">{errors.client.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              Location *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />              <Input
                id="location"
                {...register("location")}
                placeholder="e.g., Antipolo City, Rizal"
                className="w-full pl-10 overflow-hidden text-ellipsis"
                maxLength={255}
              />
            </div>
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              Description
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Brief description of the electrical engineering project..."
                rows={3}
                maxLength={500}
                className="w-full pl-10 resize-none overflow-hidden"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {watch("description")?.length || 0}/500 characters
              </div>
            </div>
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Status and Team Size Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <Activity className="h-4 w-4 mr-2 text-gray-500" />
                Status
              </Label>
              <Select
                defaultValue="planning"
                onValueChange={(value) => setValue("status", value as "planning" | "in-progress" | "on-hold" | "completed")}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="team_size" className="text-sm font-medium text-gray-700 flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                Team Size
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="team_size"
                  type="number"
                  min="1"
                  max="100"
                  {...register("team_size", { valueAsNumber: true })}
                  placeholder="e.g., 5"
                  className="w-full pl-10"
                />
              </div>
              {errors.team_size && (
                <p className="text-sm text-red-600">{errors.team_size.message}</p>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
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