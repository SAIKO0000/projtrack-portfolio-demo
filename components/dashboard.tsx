"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FolderOpen, Clock, Users, AlertTriangle, TrendingUp, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProjects } from "@/lib/hooks/useProjects"
import { useTasks } from "@/lib/hooks/useTasks"
import { supabase, type Personnel, type Project, type Task } from "@/lib/supabase"
import { ProjectFormModal } from "@/components/project-form-modal"
import { EditProjectModal } from "@/components/edit-project-modal"
import { ContentSkeleton } from "@/components/ui/content-skeleton"
import { toast } from "react-hot-toast"

export function Dashboard() {
  const { projects, loading: projectsLoading, fetchProjects, deleteProject } = useProjects()
  const { tasks, loading: tasksLoading } = useTasks()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [personnelLoading, setPersonnelLoading] = useState(true)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  // Format status with proper capitalization
  const formatStatus = (text: string | null | undefined): string => {
    if (!text) return "Unknown"
    
    // Handle specific status cases
    switch (text.toLowerCase()) {
      case 'in-progress':
        return 'In-Progress'
      case 'pending':
        return 'Pending'
      case 'completed':
        return 'Completed'
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'revision':
        return 'Revision'
      default:
        return text
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setPersonnelLoading(true)
      const personnelResult = await supabase.from('personnel').select('*')
      if (personnelResult.data) setPersonnel(personnelResult.data)
    } catch (error) {
      console.error('Error fetching personnel data:', error)
    } finally {
      setPersonnelLoading(false)
    }
  }

  const handleProjectCreated = () => {
    fetchProjects() // Refresh projects list
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`)) {
      try {
        await deleteProject(projectId)
        toast.success("Project deleted successfully")
        fetchProjects() // Refresh the list
      } catch (error) {
        console.error("Delete error:", error)
        toast.error("Failed to delete project")
      }
    }
  }

  const handleEditProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setEditingProject(project)
    }
  }

  const handleProjectUpdated = () => {
    setEditingProject(null)
    fetchProjects() // Refresh projects list
  }

  // Calculate task-based progress for a project
  const getProjectTaskProgress = useCallback((projectId: string) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId)
    if (projectTasks.length === 0) return 0
    
    const completedTasks = projectTasks.filter(task => task.status === 'completed')
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }, [tasks])

  // Get task counts for a project
  const getProjectTaskCounts = useCallback((projectId: string) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId)
    const completedTasks = projectTasks.filter(task => task.status === 'completed')
    return {
      total: projectTasks.length,
      completed: completedTasks.length
    }
  }, [tasks])
  
  // Calculate statistics with optimized performance
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'in-progress').length
    
    const now = new Date()
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      return new Date(t.due_date) < now
    }).length

    // Calculate accurate completion rate based on task progress across all projects
    const completionRate = projects.length > 0 
      ? Math.round(
          projects.reduce((acc, project) => {
            return acc + getProjectTaskProgress(project.id)
          }, 0) / projects.length
        )
      : 0

    return {
      activeProjects,
      overdueTasks, 
      completionRate,
      totalPersonnel: personnel.length
    }
  }, [projects, tasks, personnel, getProjectTaskProgress])

  // Calculate comprehensive project analytics
  const projectAnalytics = useMemo(() => {
    const analytics = {
      total: projects.length,
      completed: projects.filter(p => p.status === 'completed').length,
      inProgress: projects.filter(p => p.status === 'in-progress').length,
      planning: projects.filter(p => p.status === 'planning').length,
      onHold: projects.filter(p => p.status === 'on-hold').length,
      avgCompletion: 0,
      projectsWithTasks: 0,
      overallProgress: 0
    }

    // Calculate average completion rate across all projects
    if (projects.length > 0) {
      const progressSum = projects.reduce((sum, project) => {
        const progress = getProjectTaskProgress(project.id)
        if (progress > 0) analytics.projectsWithTasks += 1
        return sum + progress
      }, 0)
      
      analytics.avgCompletion = Math.round(progressSum / projects.length)
      analytics.overallProgress = analytics.avgCompletion
    }

    return analytics
  }, [projects, getProjectTaskProgress])
  
  // Show loading only if all major data is still loading
  const isLoading = projectsLoading && tasksLoading && personnelLoading

  if (isLoading) {
    return <ContentSkeleton type="dashboard" />
  }

  // Calculate dynamic project progress data based on actual project timelines
  const getProjectProgressData = () => {
    const monthsData = new Map()
    const now = new Date()
    
    // Get last 6 months for better visualization
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      monthsData.set(monthKey, { 
        name: monthKey, 
        completed: 0, 
        ongoing: 0, 
        started: 0
      })
    }

    // Helper function to get completion month for a project
    const getCompletionMonth = (project: Project) => {
      // Priority: end_date > updated_at > created_at > current month
      if (project.end_date) {
        return new Date(project.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      }
      if (project.updated_at) {
        return new Date(project.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      }
      if (project.created_at) {
        return new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      }
      return now.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    }

    // Process each project
    projects.forEach(project => {
      const projectProgress = getProjectTaskProgress(project.id)
      
      // Track when projects started
      if (project.start_date) {
        const startDate = new Date(project.start_date)
        const startMonth = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        
        if (monthsData.has(startMonth)) {
          monthsData.get(startMonth).started += 1
        }
      }

      // Track completed projects - either by status or by 100% task completion
      const isProjectCompleted = project.status === 'completed' || projectProgress === 100
      if (isProjectCompleted) {
        const completionMonth = getCompletionMonth(project)
        if (monthsData.has(completionMonth)) {
          monthsData.get(completionMonth).completed += 1
        }
      }

      // Track ongoing projects in current month only
      if (project.status === 'in-progress') {
        const currentMonth = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        if (monthsData.has(currentMonth)) {
          monthsData.get(currentMonth).ongoing += 1
        }
      }
    })

    return Array.from(monthsData.values())
  }

  const projectProgressData = getProjectProgressData()

  // Enhanced status distribution data for pie chart with all projects
  const statusData = [
    { 
      name: "Completed", 
      value: projectAnalytics.completed,
      color: "#10B981" 
    },
    { 
      name: "In Progress", 
      value: projectAnalytics.inProgress,
      color: "#FF6B35" 
    },
    { 
      name: "Planning", 
      value: projectAnalytics.planning,
      color: "#3B82F6" 
    },
    { 
      name: "On Hold", 
      value: projectAnalytics.onHold,
      color: "#F59E0B" 
    },
  ].filter(item => item.value > 0) // Only show statuses that have projects

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-orange-100 text-orange-800"
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "on-hold":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIndicatorColor = (statusName: string) => {
    switch (statusName) {
      case 'Completed':
        return 'bg-green-500'
      case 'In Progress':
        return 'bg-orange-500'
      case 'Planning':
        return 'bg-blue-500'
      case 'On Hold':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get optimized upcoming tasks - prioritized by due date and status
  const getUpcomingTasks = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return tasks
      .filter(task => {
        // Include tasks that are not completed
        if (task.status === 'completed') return false
        
        // Include tasks with upcoming due dates or overdue tasks
        if (task.due_date) {
          const dueDate = new Date(task.due_date)
          // Show tasks due within next 2 weeks or overdue tasks
          const twoWeeksFromNow = new Date(now)
          twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)
          return dueDate <= twoWeeksFromNow
        }
        
        // Include high priority tasks without due dates
        return task.priority === 'high'
      })
      .map(task => {
        const project = projects.find(p => p.id === task.project_id)
        const dueDate = task.due_date ? new Date(task.due_date) : null
        const isOverdue = dueDate ? dueDate < now && task.status !== 'completed' : false
        const isToday = dueDate ? 
          dueDate.toDateString() === now.toDateString() : false
        const isTomorrow = dueDate ? 
          dueDate.toDateString() === tomorrow.toDateString() : false
        
        let urgencyScore = 0
        if (isOverdue) urgencyScore = 100
        else if (isToday) urgencyScore = 90
        else if (isTomorrow) urgencyScore = 80
        else if (task.priority === 'high') urgencyScore = 70
        else if (task.priority === 'medium') urgencyScore = 50
        else urgencyScore = 30

        // Add days until due date for sorting
        const daysUntilDue = dueDate ? 
          Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999

        return {
          ...task,
          project_name: project?.name || 'Unknown Project',
          project_client: project?.client,
          isOverdue,
          isToday,
          isTomorrow,
          urgencyScore,
          daysUntilDue
        }
      })
      .sort((a, b) => {
        // Sort by urgency score first, then by days until due
        if (a.urgencyScore !== b.urgencyScore) {
          return b.urgencyScore - a.urgencyScore
        }
        return a.daysUntilDue - b.daysUntilDue
      })
      .slice(0, 6) // Show top 6 most urgent tasks
  }

  const upcomingTasks = getUpcomingTasks()

  const getTaskUrgencyBadge = (task: Task & { isOverdue?: boolean; isToday?: boolean; isTomorrow?: boolean; priority?: string }) => {
    if (task.isOverdue) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    }
    if (task.isToday) {
      return <Badge className="bg-orange-100 text-orange-800">Due Today</Badge>
    }
    if (task.isTomorrow) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Tomorrow</Badge>
    }
    return <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
  }

  const formatTaskDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    const diffTime = taskDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays <= 7) return `${diffDays} days`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your projects.</p>
        </div>
        <div className="flex items-center space-x-3">
          <ProjectFormModal onProjectCreated={handleProjectCreated} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{projectAnalytics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">{projectAnalytics.completed}</span> completed, <span className="text-orange-600">{projectAnalytics.inProgress}</span> active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-orange-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-blue-600">{projectAnalytics.planning}</span> in planning phase
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-red-600">{stats.overdueTasks > 0 ? 'Needs' : 'No'}</span> immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalPersonnel}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">Across</span> {projectAnalytics.total} projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{projectAnalytics.avgCompletion}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">{projectAnalytics.projectsWithTasks}</span> projects with tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Project Progress</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Monthly project completion trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart data={projectProgressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis fontSize={10} width={30} />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="started" fill="#3B82F6" name="Started" />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
                <Bar dataKey="ongoing" fill="#F59E0B" name="Ongoing" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Project Status Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Current status of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} projects`, name]}
                  labelFormatter={() => 'Project Status'}
                  contentStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusIndicatorColor(item.name)} flex-shrink-0`} />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Recent Projects</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Latest project updates and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {projects.slice(0, 4).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{project.name}</h3>
                      <Badge className={`${getStatusColor(project.status || 'unknown')} text-xs flex-shrink-0 ml-2`}>
                        {(project.status || 'unknown').replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{project.client}</p>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="hidden sm:inline">Due </span>{formatDate(project.end_date)}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2">
                      <Progress value={getProjectTaskProgress(project.id)} className="h-2" />
                      <span className="text-xs text-gray-500 mt-1 block">
                        {getProjectTaskCounts(project.id).completed}/{getProjectTaskCounts(project.id).total} tasks ({getProjectTaskProgress(project.id)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Upcoming Tasks</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Tasks requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.length > 0 ? upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate pr-2">{task.title}</h4>
                      <div className="flex-shrink-0">
                        {getTaskUrgencyBadge(task)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {task.project_name}
                      {task.project_client && ` • ${task.project_client}`}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${task.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {formatTaskDate(task.due_date)}
                      </span>
                      <Badge className={`text-xs ${task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} flex-shrink-0`}>
                        {formatStatus(task.status) || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No upcoming tasks</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Project Modal */}
      <EditProjectModal
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        onProjectUpdated={handleProjectUpdated}
      />
    </div>
  )
}
