"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar-custom"
import { useProjectsQuery } from "@/lib/hooks/useProjectsOptimized"
import { useGanttTasks } from "@/lib/hooks/useGanttTasks"
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  X, 
  FolderOpen,
  Users,
  Activity,
  FileText,
  Loader2,
  CheckSquare
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { useModalMobileHide } from "@/lib/modal-mobile-utils"

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
  notes: string // New notes field
  project_id: string
  start_date: Date | undefined
  end_date: Date | undefined
  status: string
  phase: string
  assignees: string[] // Changed from single assignee to multiple
  assignee_headcounts: Record<string, number> // Head count for each role
  duration_days: number | undefined // New field for duration input
  date_input_mode: 'calendar' | 'duration' // New field to track input mode
}

interface TaskFormModalProps {
  readonly onTaskCreated?: () => void
  readonly defaultProjectId?: string
}

export function TaskFormModal({ onTaskCreated, defaultProjectId }: TaskFormModalProps) {
  const { data: projects = [] } = useProjectsQuery()
  const { createTask } = useGanttTasks()
  const [open, setOpen] = useState(false)
  
  // Hide mobile header when modal is open
  useModalMobileHide(open)
  
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    notes: "", // Initialize notes field
    project_id: defaultProjectId || "",
    start_date: undefined,
    end_date: undefined,
    status: "not-started",
    phase: "Planning",
    assignees: [], // Changed from assignee: "" to assignees: []
    assignee_headcounts: {}, // Initialize empty headcounts
    duration_days: undefined,
    date_input_mode: 'calendar'
  })

  // Update project_id when defaultProjectId changes
  useEffect(() => {
    if (defaultProjectId && formData.project_id !== defaultProjectId) {
      setFormData(prev => ({
        ...prev,
        project_id: defaultProjectId
      }))
    }
  }, [defaultProjectId, formData.project_id])

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
        notes: formData.notes || null, // Include notes field
        project_id: formData.project_id,
        start_date: formatDateToLocal(startDate),
        end_date: formatDateToLocal(endDate),
        due_date: formatDateToLocal(endDate),
        status: formData.status,
        priority: "low", // Set default priority
        progress: 0, // Always start at 0 since we don't track progress
        phase: formData.phase || null,
        category: "planning", // Set default category
        assignee: formData.assignees.length > 0 ? formData.assignees.join(", ") : null, // Join multiple assignees
        assignee_headcounts: formData.assignee_headcounts, // Store headcount data
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
        notes: "", // Include notes field in reset
        project_id: "",
        start_date: undefined,
        end_date: undefined,
        status: "not-started",
        phase: "Planning",
        assignees: [], // Reset to empty array
        assignee_headcounts: {}, // Reset headcounts
        duration_days: undefined,
        date_input_mode: 'calendar'
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

  const handleInputChange = (field: keyof TaskFormData, value: string | Date | number) => {
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

  const handleRemoveAssignee = (assigneeToRemove: string) => {
    setFormData(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-9 sm:h-10 md:min-h-[44px] shadow-sm text-xs sm:text-sm px-3 sm:px-4">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add Task</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] w-[95vw] sm:w-auto max-h-[85vh] sm:max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-xl">
        <DialogHeader className="space-y-1 sm:space-y-2 p-2 sm:p-3 border-b border-gray-100">
          <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 flex flex-col sm:flex-row items-center sm:items-start">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 shadow-lg">
              <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <span className="block">Create New Task</span>
              <span className="text-xs font-normal text-gray-600 block">Add a new task to your project timeline</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 p-2 sm:p-3">
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {/* Task Title */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="title" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-500" />
                Task Title *
              </Label>
              <div className="relative">
                <CheckSquare className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Install main electrical panel"
                  className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-gray-900 placeholder:text-gray-500 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Description and Notes in one row */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Description */}
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-500" />
                  Description
                </Label>
                <div className="relative">
                  <FileText className="absolute left-2 sm:left-3 top-2 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Detailed description of the task..."
                    rows={2}
                    className="w-full pl-7 sm:pl-10 pt-2 sm:pt-3 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-gray-900 placeholder:text-gray-500 resize-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="notes" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                  Notes
                </Label>
                <div className="relative">
                  <FileText className="absolute left-2 sm:left-3 top-2 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes for the task..."
                    rows={2}
                    className="w-full pl-7 sm:pl-10 pt-2 sm:pt-3 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg text-gray-900 placeholder:text-gray-500 resize-none text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Project - Single row */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="project" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-500" />
                Project *
              </Label>
              <div className="relative">
                <FolderOpen className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10" />
                <Select 
                  value={formData.project_id} 
                  onValueChange={(value) => handleInputChange("project_id", value)}
                >
                  <SelectTrigger className="w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-xs sm:text-sm">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="text-xs sm:text-sm">
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

            {/* Multiple Assignees Section */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-500" />
                Assignees
              </Label>
              
              {/* Add Assignee Interface with embedded headcount */}
              <div className="space-y-2">
                {/* Show current assignees with editable headcount */}
                {formData.assignees.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">Assigned (click to edit headcount):</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.assignees.map((assignee) => (
                        <div key={assignee} className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                          <span className="text-xs sm:text-sm font-medium text-orange-800">{assignee}</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="1"
                              max="50"
                              value={formData.assignee_headcounts[assignee] || 1}
                              onChange={(e) => {
                                const headcount = parseInt(e.target.value)
                                if (!isNaN(headcount) && headcount > 0) {
                                  handleHeadcountChange(assignee, headcount)
                                }
                              }}
                              className="w-14 h-6 text-xs text-center bg-white border-orange-300 focus:border-orange-500 rounded"
                            />
                            <span className="text-xs text-orange-600">people</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            onClick={() => handleRemoveAssignee(assignee)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add new assignee dropdown */}
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="flex-1 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Select role to assign..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_ROLES.map((role) => (
                        <SelectItem 
                          key={role} 
                          value={role}
                          disabled={formData.assignees.includes(role)}
                          className="text-xs sm:text-sm"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{role}</span>
                            {formData.assignees.includes(role) && (
                              <span className="text-xs text-gray-500 ml-2">Already assigned</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
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
                    }}
                    disabled={!selectedRole || formData.assignees.includes(selectedRole)}
                    className="whitespace-nowrap h-8 sm:h-10 px-3 text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Date Range - Start and End Date in one row */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-500" />
                Start Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-8 sm:h-10 justify-start text-left font-normal bg-white/80 border-gray-200 hover:border-orange-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-xs sm:text-sm",
                      !formData.start_date && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
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
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-500" />
                  End Date *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange("date_input_mode", 
                    formData.date_input_mode === 'calendar' ? 'duration' : 'calendar'
                  )}
                  className="text-xs h-5 px-2 py-0 border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                >
                  {formData.date_input_mode === 'calendar' ? 'Days' : 'Calendar'}
                </Button>
              </div>
              
              {formData.date_input_mode === 'calendar' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-8 sm:h-10 justify-start text-left font-normal bg-white/80 border-gray-200 hover:border-orange-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-xs sm:text-sm",
                        !formData.end_date && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
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
                    className="w-full h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-xs sm:text-sm"
                  />
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

          {/* Status and Phase in one row */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="status" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-500" />
                Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started" className="text-xs sm:text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-500 mr-2"></div>
                      Not Started
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress" className="text-xs sm:text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 mr-2"></div>
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="completed" className="text-xs sm:text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 mr-2"></div>
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="delayed" className="text-xs sm:text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500 mr-2"></div>
                      Delayed
                    </div>
                  </SelectItem>
                  <SelectItem value="on-hold" className="text-xs sm:text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500 mr-2"></div>
                      On Hold
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="phase" className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-500" />
                Phase
              </Label>
              <Select 
                value={formData.phase} 
                onValueChange={(value) => handleInputChange("phase", value)}
              >
                <SelectTrigger className="h-8 sm:h-10 bg-white/80 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning" className="text-xs sm:text-sm">Planning</SelectItem>
                  <SelectItem value="Design" className="text-xs sm:text-sm">Design</SelectItem>
                  <SelectItem value="Development" className="text-xs sm:text-sm">Development</SelectItem>
                  <SelectItem value="Testing" className="text-xs sm:text-sm">Testing</SelectItem>
                  <SelectItem value="Deployment" className="text-xs sm:text-sm">Deployment</SelectItem>
                  <SelectItem value="Maintenance" className="text-xs sm:text-sm">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-row justify-end gap-2 pt-2 sm:pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-8 sm:h-10 px-3 sm:px-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-8 sm:h-10 px-4 sm:px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
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
