"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar-custom"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useProjects } from "@/lib/hooks/useProjects"
import { useGanttTasks } from "@/lib/hooks/useGanttTasks"
import { Plus, Calendar as CalendarIcon, Clock, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"

// Predefined roles based on your project structure
// PROJECT STAFF and DIRECT LABOR are categories, not assignable roles
const PROJECT_ROLES = [
  "PROJECT IN-CHARGE", 
  "PROJECT ENGINEER",
  "GC ENGINEER",
  "SAFETY OFFICER",
  "FOREMAN",
  "ELECTRICIAN",
  "HELPER",
  "WELDER/FABRICATOR",
  "TIME KEEPER/WAREHOUSEMEN"
] as const

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
  assignees: string[] // Changed from single assignee to multiple
}

interface TaskFormModalProps {
  readonly onTaskCreated?: () => void
}

export function TaskFormModalOptimized({ onTaskCreated }: TaskFormModalProps) {
  const { projects } = useProjects()
  const { createTask } = useGanttTasks()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
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
    assignees: [] // Changed from assignee: "" to assignees: []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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

    setLoading(true)
    try {
      const startDate = formData.start_date
      const endDate = formData.end_date
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Format dates to YYYY-MM-DD string format for database
      const formatDateToLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const taskData = {
        title: formData.title,
        description: formData.description || null,
        project_id: formData.project_id,
        start_date: formatDateToLocal(startDate),
        end_date: formatDateToLocal(endDate),
        due_date: formatDateToLocal(endDate),
        status: formData.status,
        priority: formData.priority,
        progress: 0, // Always start at 0 since we don't track progress
        phase: formData.phase || null,
        category: formData.category as "planning" | "pre-construction" | "construction" | "finishing" | "closeout",
        assignee: formData.assignees.length > 0 ? formData.assignees.join(", ") : null, // Join multiple assignees
        assigned_to: null,
        estimated_hours: duration * 8, // Assume 8 hours per day
        duration,
        dependencies: [],
        gantt_position: null
      }

      await createTask(taskData)

      toast.success("Task created successfully!")
      setOpen(false)
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        project_id: "",
        start_date: undefined,
        end_date: undefined,
        status: "not-started",
        priority: "medium",
        phase: "Planning",
        category: "planning",
        assignees: [] // Reset to empty array
      })
      
      // Refresh data
      onTaskCreated?.()
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof TaskFormData, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddAssignee = () => {
    if (selectedRole && !formData.assignees.includes(selectedRole)) {
      setFormData(prev => ({
        ...prev,
        assignees: [...prev.assignees, selectedRole]
      }))
      setSelectedRole("")
    }
  }

  const handleRemoveAssignee = (assigneeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.filter(assignee => assignee !== assigneeToRemove)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 w-full sm:w-auto h-9 sm:h-10 md:min-h-[44px] shadow-sm text-sm px-3 sm:px-4">
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Create New Task</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="project">Project *</Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(value) => handleInputChange("project_id", value)}
              >
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

            {/* Multiple Assignees Section */}
            <div className="space-y-2">
              <Label>Assignees</Label>
              
              {/* Current Assignees */}
              {formData.assignees.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.assignees.map((assignee, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="flex items-center gap-1 pr-1"
                    >
                      {assignee}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveAssignee(assignee)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Assignee Interface */}
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select role to assign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_ROLES.map((role) => (
                      <SelectItem 
                        key={role} 
                        value={role}
                        disabled={formData.assignees.includes(role)}
                      >
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAssignee}
                  disabled={!selectedRole || formData.assignees.includes(selectedRole)}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
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
                    onSelect={(date) => date && handleInputChange("start_date", date)}
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
              {formData.project_id ? (() => {
                const selectedProject = projects.find(p => p.id === formData.project_id)
                if (selectedProject?.start_date) {
                  const projectStartDate = new Date(selectedProject.start_date)
                  return (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cannot be before project start date: {projectStartDate.toLocaleDateString("en-US", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )
                }
                return null
              })() : (
                <p className="text-xs text-muted-foreground mt-1">
                  Select a project first to see date restrictions
                </p>
              )}
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
                    onSelect={(date) => date && handleInputChange("end_date", date)}
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
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange("status", value)}
              >
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
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleInputChange("priority", value)}
              >
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
              <Select 
                value={formData.phase} 
                onValueChange={(value) => handleInputChange("phase", value)}
              >
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
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange("category", value)}
              >
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
