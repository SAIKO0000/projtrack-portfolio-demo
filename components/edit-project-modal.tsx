"use client"

import { useState, useEffect } from "react"
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
  MapPin,
  FileText,
  Activity,
  Users,
  X,
  Edit
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useProjects } from "@/lib/hooks/useProjects"
import { toast } from "react-hot-toast"
import type { Project } from "@/lib/supabase"

const editProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255, "Name too long"),
  description: z.string().max(500, "Description too long (max 500 characters)").optional(),
  client: z.string().min(1, "Client name is required").max(255, "Client name too long"),
  location: z.string().min(1, "Location is required").max(255, "Location too long"),
  status: z.enum(["planning", "in-progress", "on-hold", "completed"]),
  team_size: z.number().min(1, "Team size must be at least 1").max(100, "Team size too large"),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
})

type EditProjectFormData = z.infer<typeof editProjectSchema>

interface EditProjectModalProps {
  readonly project: Project | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onProjectUpdated: () => void
}

export function EditProjectModal({ project, open, onOpenChange, onProjectUpdated }: EditProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateProject } = useProjects()

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

  // Populate form when project changes
  useEffect(() => {
    if (project && open) {
      reset({
        name: project.name,
        description: project.description || "",
        client: project.client || "",
        location: project.location || "",
        status: project.status as any,
        team_size: project.team_size,
        start_date: project.start_date ? new Date(project.start_date) : undefined,
        end_date: project.end_date ? new Date(project.end_date) : undefined,
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

      await updateProject(project.id, projectData)
      
      toast.success("Project updated successfully!")
      onOpenChange(false)
      onProjectUpdated()
    } catch (error) {
      console.error("Error updating project:", error)
      toast.error("Failed to update project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!project) return null

  return (    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto break-words">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center break-words">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3 shadow-sm flex-shrink-0">
              <Edit className="h-5 w-5 text-blue-500" />
            </div>
            <span className="break-words">Edit Project</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 ml-13 break-words">
            Update project details and information.
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
                defaultValue={project.status}
                onValueChange={(value) => setValue("status", value as any)}
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
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="on-hold">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      On Hold
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
                  placeholder="5"
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
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
