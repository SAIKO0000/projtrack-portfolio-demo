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
import { Badge } from "@/components/ui/badge"
import { useProjects } from "@/lib/hooks/useProjects"
import { useGanttTasks } from "@/lib/hooks/useGanttTasks"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  X, 
  Plus, 
  Save,
  CheckSquare,
  FileText,
  FolderOpen,
  Users,
  Activity,
  User,
  Edit
} from "lucide-react"
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
  phase: string
  assignees: string[] // Changed from assignee to assignees
  assignee_headcounts: Record<string, number> // New field for head counts
  duration_days: number | undefined // New field for duration input
  date_input_mode: 'calendar' | 'duration' // New field to track input mode
}

interface TaskEditModalProps {
  readonly task: Task | null
  readonly open: boolean
  readonly onOpenChangeAction: (open: boolean) => void
  readonly onTaskUpdated?: () => void
}

export function TaskEditModalOptimized({ task, open, onOpenChangeAction, onTaskUpdated }: TaskEditModalProps) {
  const { projects } = useProjects()
  const { updateTask } = useGanttTasks()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    project_id: "",
    start_date: undefined,
    end_date: undefined,
    status: "not-started",
    phase: "Planning",
    assignees: [], // Changed from assignee: "" to assignees: []
    assignee_headcounts: {}, // Initialize empty headcounts
    duration_days: undefined,
    date_input_mode: 'calendar'
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
      // Parse existing assignees (split by comma if multiple)
      const existingAssignees = task.assignee 
        ? task.assignee.split(', ').map(a => a.trim()).filter(a => a.length > 0)
        : []
      
      // Initialize headcounts for existing assignees
      const initialHeadcounts: Record<string, number> = {}
      existingAssignees.forEach(assignee => {
        initialHeadcounts[assignee] = 1 // Default to 1 person
      })
      
      setFormData({
        title: task.title || "",
        description: task.description || "",
        project_id: task.project_id || "",
        start_date: parseDateFromDatabase(task.start_date),
        end_date: parseDateFromDatabase(task.end_date),
        status: task.status || "not-started",
        phase: task.phase || "Planning",
        assignees: existingAssignees, // Use parsed assignees array
        assignee_headcounts: initialHeadcounts,
        duration_days: undefined,
        date_input_mode: 'calendar'
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
        priority: "low", // Set default priority
        progress: 0, // We don't track progress anymore
        phase: formData.phase,
        category: "planning", // Set default category
        assignee: formData.assignees.length > 0 ? formData.assignees.join(", ") : null, // Join multiple assignees
        assignee_headcounts: formData.assignee_headcounts, // Store headcount data
      })

      toast.success("Task updated successfully!")
      onTaskUpdated?.()
      onOpenChangeAction(false)
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error("Failed to update task. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof TaskFormData, value: string | Date | number | undefined) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-calculate end date when duration is entered and start date exists
      if (field === 'duration_days' && typeof value === 'number' && newData.start_date) {
        const endDate = new Date(newData.start_date)
        endDate.setDate(endDate.getDate() + value - 1) // -1 because the duration includes the start date
        newData.end_date = endDate
      }
      
      // Auto-calculate duration when dates change
      if ((field === 'start_date' || field === 'end_date') && newData.start_date && newData.end_date) {
        const timeDiff = newData.end_date.getTime() - newData.start_date.getTime()
        const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates
        newData.duration_days = dayDiff
      }
      
      return newData
    })
  }

  // Calculate duration in days between start and end date
  const calculateDuration = () => {
    if (formData.start_date && formData.end_date) {
      const timeDiff = formData.end_date.getTime() - formData.start_date.getTime()
      const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1
      return dayDiff
    }
    return null
  }

  const handleAddAssignee = () => {
    if (selectedRole && !formData.assignees.includes(selectedRole)) {
      setFormData(prev => ({
        ...prev,
        assignees: [...prev.assignees, selectedRole],
        assignee_headcounts: {
          ...prev.assignee_headcounts,
          [selectedRole]: 1 // Default to 1 person
        }
      }))
      setSelectedRole("")
    }
  }

  const handleRemoveAssignee = (assigneeToRemove: string) => {
    setFormData(prev => {
      const { [assigneeToRemove]: _, ...remainingHeadcounts } = prev.assignee_headcounts
      return {
        ...prev,
        assignees: prev.assignees.filter(assignee => assignee !== assigneeToRemove),
        assignee_headcounts: remainingHeadcounts
      }
    })
  }

  const handleHeadcountChange = (assignee: string, headcount: number) => {
    setFormData(prev => ({
      ...prev,
      assignee_headcounts: {
        ...prev.assignee_headcounts,
        [assignee]: Math.max(1, headcount) // Ensure at least 1
      }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[650px] max-w-[95vw] max-h-[88vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl mx-4">
        <DialogHeader className="space-y-2 p-3 sm:p-4 border-b border-gray-100">
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3 shadow-lg">
              <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <span className="block">Edit Task</span>
              <span className="text-xs font-normal text-gray-600 block mt-1">Update task details and timeline</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4 p-3 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Title */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center">
                <CheckSquare className="h-4 w-4 mr-2 text-blue-500" />
                Task Title *
              </Label>
              <div className="relative">
                <CheckSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Install main electrical panel"
                  className="w-full pl-12 h-12 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                Description
              </Label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of the task..."
                  rows={3}
                  className="w-full pl-12 pt-4 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-gray-900 placeholder:text-gray-500 resize-none"
                />
              </div>
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project" className="text-sm font-semibold text-gray-700 flex items-center">
                <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                Project *
              </Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(value) => handleInputChange('project_id', value)}
              >
                <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-blue-500 rounded-xl">
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
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                Assignees
              </Label>
              
              {/* Current Assignees */}
              {formData.assignees.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.assignees.map((assignee, index) => (
                    <div key={index} className="flex items-center gap-2 bg-blue-50 rounded-lg p-2 border border-blue-200">
                      <Badge 
                        variant="secondary" 
                        className="bg-blue-100 text-blue-800 border-blue-300"
                      >
                        {assignee}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          value={formData.assignee_headcounts[assignee] || 1}
                          onChange={(e) => handleHeadcountChange(assignee, parseInt(e.target.value))}
                          className="w-16 h-6 text-xs text-center bg-white border-gray-300"
                        />
                        <span className="text-xs text-gray-600">ppl</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 rounded-full"
                        onClick={() => handleRemoveAssignee(assignee)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Assignee Interface */}
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1 h-10 bg-white/80 border-gray-200 focus:border-blue-500 rounded-lg">
                    <SelectValue placeholder="Select role..." />
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
                  className="h-10 px-4 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                Start Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 bg-white/80 border-gray-200 focus:border-blue-500 rounded-xl",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4" />
                    <span>
                      {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => handleInputChange('start_date', date)}
                    disabled={(date) => {
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
              {/* Project date constraint info */}
              {formData.project_id && (() => {
                const selectedProject = projects.find(p => p.id === formData.project_id)
                if (selectedProject?.start_date) {
                  return (
                    <p className="text-xs text-gray-500 mt-1">
                      Project starts: {new Date(selectedProject.start_date).toLocaleDateString("en-PH")}
                    </p>
                  )
                }
                return null
              })()}
            </div>

            {/* End Date with Duration Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                  End Date *
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange("date_input_mode", 
                      formData.date_input_mode === 'calendar' ? 'duration' : 'calendar'
                    )}
                    className="text-xs h-7 px-2"
                  >
                    {formData.date_input_mode === 'calendar' ? 'Use Days' : 'Use Calendar'}
                  </Button>
                </div>
              </div>
              
              {formData.date_input_mode === 'calendar' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal bg-white/80 border-gray-200 hover:border-blue-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl",
                        !formData.end_date && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4 text-gray-400" />
                      {formData.end_date ? format(formData.end_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => date && handleInputChange('end_date', date)}
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
                          if (checkDate < projectStart) {
                            return true
                          }
                        }
                        
                        // End date cannot be after project end date
                        if (selectedProject?.end_date) {
                          const projectEndDate = new Date(selectedProject.end_date)
                          const projectEnd = new Date(projectEndDate.getFullYear(), projectEndDate.getMonth(), projectEndDate.getDate())
                          const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                          if (checkDate > projectEnd) {
                            return true
                          }
                        }
                        
                        return false
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.duration_days || ''}
                      onChange={(e) => {
                        const days = parseInt(e.target.value)
                        if (!isNaN(days) && days > 0) {
                          handleInputChange("duration_days", days)
                        }
                      }}
                      placeholder="Number of days"
                      className="flex-1 h-12 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                    />
                    <div className="flex items-center px-3 bg-gray-100 rounded-xl">
                      <span className="text-sm text-gray-600">days</span>
                    </div>
                  </div>
                  {formData.start_date && formData.duration_days && (
                    <p className="text-xs text-gray-600">
                      End date will be: {(() => {
                        const endDate = new Date(formData.start_date)
                        endDate.setDate(endDate.getDate() + formData.duration_days - 1)
                        return endDate.toLocaleDateString("en-US", {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      })()}
                    </p>
                  )}
                </div>
              )}
              
              {/* Project date constraint info */}
              {formData.project_id && (() => {
                const selectedProject = projects.find(p => p.id === formData.project_id)
                if (selectedProject?.end_date) {
                  return (
                    <p className="text-xs text-gray-500 mt-1">
                      Project ends: {new Date(selectedProject.end_date).toLocaleDateString("en-PH")}
                    </p>
                  )
                }
                return null
              })()}
              
              {/* Duration Display */}
              {formData.start_date && formData.end_date && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-blue-700">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      Duration: {calculateDuration()} day{calculateDuration() !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status and Phase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-gray-700 flex items-center">
                <Activity className="h-4 w-4 mr-2 text-blue-500" />
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-blue-500 rounded-xl">
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

            <div className="space-y-2">
              <Label htmlFor="phase" className="text-sm font-semibold text-gray-700 flex items-center">
                <Activity className="h-4 w-4 mr-2 text-blue-500" />
                Phase
              </Label>
              <Select value={formData.phase} onValueChange={(value) => handleInputChange('phase', value)}>
                <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-blue-500 rounded-xl">
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
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChangeAction(false)}
              disabled={loading}
              className="h-12 px-6 bg-white hover:bg-gray-50 border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="h-12 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
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
