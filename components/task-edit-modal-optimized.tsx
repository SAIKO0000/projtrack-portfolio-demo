"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar-custom"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useProjects } from "@/lib/hooks/useProjects"
import { useGanttTasks } from "@/lib/hooks/useGanttTasks"
import { Calendar as CalendarIcon, Clock, Save } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"

interface Task {
  id: string
  title: string | null
  description: string | null
  project_id: string | null
  start_date: string | null
  end_date: string | null
  status: string | null
  priority: string | null
  phase: string | null
  category: string | null
  assignee: string | null
}

interface TaskFormData {
  title: string
  description: string
  project_id: string
  start_date: Date | undefined
  end_date: Date | undefined
  status: string
  priority: string
  phase: string
  category: string
  assignee: string
}

interface TaskEditModalProps {
  readonly task: Task | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onTaskUpdated?: () => void
}

export function TaskEditModalOptimized({ task, open, onOpenChange, onTaskUpdated }: TaskEditModalProps) {
  const { projects } = useProjects()
  const { updateTask } = useGanttTasks()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    project_id: "",
    start_date: undefined,
    end_date: undefined,
    status: "not-started",
    priority: "medium",
    phase: "Planning",
    category: "planning",
    assignee: "",
  })

  const parseDateFromDatabase = (dateString: string | null) => {
    if (!dateString) return undefined
    // Parse date in local timezone to prevent timezone conversion issues
    // Assumes database stores dates in YYYY-MM-DD format
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed in JavaScript
  }

  // Load task data when modal opens or task changes
  useEffect(() => {
    if (task && open) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        project_id: task.project_id || "",
        start_date: parseDateFromDatabase(task.start_date),
        end_date: parseDateFromDatabase(task.end_date),
        status: task.status || "not-started",
        priority: task.priority || "medium",
        phase: task.phase || "Planning",
        category: task.category || "planning",
        assignee: task.assignee || "",
      })
    }
  }, [task, open])

  const formatDateForDatabase = (date: Date) => {
    // Create a new date with the same year, month, and day but in local timezone
    // This prevents timezone conversion issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

    if (!formData.title.trim()) {
      toast.error("Please enter a task title")
      return
    }

    if (!formData.project_id) {
      toast.error("Please select a project")
      return
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error("Please select start and end dates")
      return
    }

    if (formData.end_date < formData.start_date) {
      toast.error("End date must be after start date")
      return
    }

    // Check if task start date is not before project start date
    const selectedProject = projects.find(p => p.id === formData.project_id)
    if (selectedProject?.start_date) {
      const projectStartDate = new Date(selectedProject.start_date)
      // Normalize to just date comparison (ignore time)
      const projectStart = new Date(projectStartDate.getFullYear(), projectStartDate.getMonth(), projectStartDate.getDate())
      const taskStart = new Date(formData.start_date.getFullYear(), formData.start_date.getMonth(), formData.start_date.getDate())
      
      if (taskStart < projectStart) {
        toast.error(`Task start date cannot be before project start date (${projectStartDate.toLocaleDateString("en-PH")})`)
        return
      }
    }

    try {
      setLoading(true)
      
      await updateTask(task.id, {
        title: formData.title,
        description: formData.description,
        project_id: formData.project_id,
        start_date: formData.start_date ? formatDateForDatabase(formData.start_date) : null,
        end_date: formData.end_date ? formatDateForDatabase(formData.end_date) : null,
        status: formData.status,
        priority: formData.priority,
        progress: 0, // We don't track progress anymore
        phase: formData.phase,
        category: formData.category as "planning" | "pre-construction" | "construction" | "finishing" | "closeout" | null,
        assignee: formData.assignee,
      })

      toast.success("Task updated successfully!")
      onTaskUpdated?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error("Failed to update task. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="project">Project *</Label>
              <Select value={formData.project_id} onValueChange={(value) => handleInputChange('project_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={formData.assignee}
                onChange={(e) => handleInputChange('assignee', e.target.value)}
                placeholder="Enter assignee name"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => handleInputChange('start_date', date)}
                    disabled={(date) => {
                      // Get selected project's start date
                      const selectedProject = projects.find(p => p.id === formData.project_id)
                      if (selectedProject?.start_date) {
                        const projectStartDate = new Date(selectedProject.start_date)
                        const projectStart = new Date(projectStartDate.getFullYear(), projectStartDate.getMonth(), projectStartDate.getDate())
                        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                        return checkDate < projectStart
                      }
                      return false
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => handleInputChange('end_date', date)}
                    disabled={(date) => {
                      // End date cannot be before start date
                      if (formData.start_date && date < formData.start_date) {
                        return true
                      }
                      
                      // End date cannot be before project start date
                      const selectedProject = projects.find(p => p.id === formData.project_id)
                      if (selectedProject?.start_date) {
                        const projectStartDate = new Date(selectedProject.start_date)
                        const projectStart = new Date(projectStartDate.getFullYear(), projectStartDate.getMonth(), projectStartDate.getDate())
                        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                        return checkDate < projectStart
                      }
                      
                      return false
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phase and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phase">Phase</Label>
              <Select value={formData.phase} onValueChange={(value) => handleInputChange('phase', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Deployment">Deployment</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="pre-construction">Pre-Construction</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="finishing">Finishing</SelectItem>
                  <SelectItem value="closeout">Closeout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Task
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
