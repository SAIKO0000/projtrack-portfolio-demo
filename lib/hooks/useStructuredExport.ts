import { useCallback, useState } from 'react'
import { toast } from 'react-hot-toast'
import { 
  exportStructuredPDF, 
  type ProjectData, 
  type TaskData, 
  type ExportOptions 
} from '@/lib/structured-pdf-export-service'

interface UseStructuredExportProps {
  projects: Array<{
    id: string
    name: string
    client?: string
    status: string
    start_date: string
    end_date: string
    budget?: number
    spent?: number
    priority?: string
    category?: string
  }>
  tasks: Array<{
    id: string
    title: string
    description?: string
    project_id: string
    project_name?: string
    start_date?: string
    end_date?: string
    status: string
    priority?: string
    assignee?: string
    progress?: number
    phase?: string
    category?: string
    estimated_hours?: number
    is_overdue?: boolean
    days_until_deadline?: number
    completed_at?: string
    notes?: string
    assignee_headcounts?: Record<string, number>
  }>
}

export function useStructuredExport({ projects, tasks }: UseStructuredExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const exportStructuredReport = useCallback(async (options: ExportOptions) => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Validate data
      if (!projects || projects.length === 0) {
        throw new Error('No projects available for export')
      }

      if (!tasks || tasks.length === 0) {
        throw new Error('No tasks available for export')
      }

      // Progress updates for user feedback
      setExportProgress(10)
      
      // Transform data to match export service interface
      const projectData: ProjectData[] = projects.map(project => ({
        id: project.id,
        name: project.name,
        client: project.client,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        budget: project.budget,
        spent: project.spent,
        priority: project.priority,
        category: project.category
      }))

      setExportProgress(25)

      const taskData: TaskData[] = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        project_id: task.project_id,
        project_name: task.project_name,
        start_date: task.start_date,
        end_date: task.end_date,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee,
        progress: task.progress,
        phase: task.phase,
        category: task.category,
        estimated_hours: task.estimated_hours,
        is_overdue: task.is_overdue,
        days_until_deadline: task.days_until_deadline,
        completed_at: task.completed_at,
        notes: task.notes,
        assignee_headcounts: task.assignee_headcounts
      }))

      setExportProgress(50)

      // Validate specific project if selected
      if (options.exportType === 'specific-project') {
        if (!options.projectId) {
          throw new Error('Project ID is required for specific project export')
        }

        const selectedProject = projectData.find(p => p.id === options.projectId)
        if (!selectedProject) {
          throw new Error('Selected project not found')
        }

        const projectTasks = taskData.filter(t => t.project_id === options.projectId)
        if (projectTasks.length === 0) {
          throw new Error('No tasks found for the selected project')
        }
      }

      setExportProgress(75)

      // Generate the PDF
      await exportStructuredPDF(projectData, taskData, options)

      setExportProgress(100)

      // Success notification
      const exportTypeLabel = options.exportType === 'all-projects' 
        ? 'Portfolio Summary' 
        : 'Project Report'
      
      const projectName = options.projectId 
        ? projectData.find(p => p.id === options.projectId)?.name || 'Unknown Project'
        : 'All Projects'

      toast.success(
        `${exportTypeLabel} exported successfully! (${projectName})`,
        {
          duration: 1000,
          icon: '📄'
        }
      )

    } catch (error) {
      console.error('Export error:', error)
      
      let errorMessage = 'Failed to export report'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error(errorMessage, {
        duration: 1000,
        icon: '❌'
      })

      throw error
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }, [projects, tasks])

  const getExportSummary = useCallback((options: ExportOptions) => {
    const summary = {
      exportType: options.exportType,
      projectCount: 0,
      taskCount: 0,
      selectedProject: null as { name: string; client?: string } | null,
      includedSections: [] as string[],
      estimatedPages: 0
    }

    if (options.exportType === 'all-projects') {
      summary.projectCount = projects.length
      summary.taskCount = tasks.length
    } else if (options.projectId) {
      summary.projectCount = 1
      summary.taskCount = tasks.filter(t => t.project_id === options.projectId).length
      const project = projects.find(p => p.id === options.projectId)
      if (project) {
        summary.selectedProject = {
          name: project.name,
          client: project.client
        }
      }
    }

    // Calculate included sections
    summary.includedSections.push('Executive Summary')
    summary.includedSections.push('Project Overview')
    
    if (options.includeTaskDetails) {
      summary.includedSections.push('Task Details')
    }
    
    if (options.includeResourceAnalysis) {
      summary.includedSections.push('Resource Analysis')
    }
    
    if (options.includeTimeline) {
      summary.includedSections.push('Timeline Analysis')
    }
    
    if (options.includeTechnicalSpecs) {
      summary.includedSections.push('Technical Specifications')
    }
    
    summary.includedSections.push('Risk Assessment')

    // Estimate page count
    let pages = 3 // Base pages
    if (options.includeTaskDetails) pages += options.exportType === 'all-projects' ? 2 : 3
    if (options.includeResourceAnalysis) pages += 1
    if (options.includeTimeline) pages += 1
    if (options.includeTechnicalSpecs) pages += 1
    
    summary.estimatedPages = pages

    return summary
  }, [projects, tasks])

  const validateExportOptions = useCallback((options: ExportOptions): string[] => {
    const errors: string[] = []

    if (options.exportType === 'specific-project') {
      if (!options.projectId) {
        errors.push('Project selection is required for specific project export')
      } else {
        const project = projects.find(p => p.id === options.projectId)
        if (!project) {
          errors.push('Selected project not found')
        } else {
          const projectTasks = tasks.filter(t => t.project_id === options.projectId)
          if (projectTasks.length === 0) {
            errors.push('Selected project has no tasks to export')
          }
        }
      }
    }

    if (projects.length === 0) {
      errors.push('No projects available for export')
    }

    if (tasks.length === 0) {
      errors.push('No tasks available for export')
    }

    return errors
  }, [projects, tasks])

  const getProjectTaskSummary = useCallback((projectId?: string) => {
    if (!projectId) {
      return {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        overdueTasks: tasks.filter(t => t.is_overdue).length,
        assignees: [...new Set(tasks.map(t => t.assignee).filter(Boolean))].length
      }
    }

    const projectTasks = tasks.filter(t => t.project_id === projectId)
    return {
      totalTasks: projectTasks.length,
      completedTasks: projectTasks.filter(t => t.status === 'completed').length,
      overdueTasks: projectTasks.filter(t => t.is_overdue).length,
      assignees: [...new Set(projectTasks.map(t => t.assignee).filter(Boolean))].length
    }
  }, [tasks])

  return {
    exportStructuredReport,
    isExporting,
    exportProgress,
    getExportSummary,
    validateExportOptions,
    getProjectTaskSummary
  }
}

// Export utility functions for additional data processing
export const processTasksForExport = (tasks: Record<string, unknown>[]) => {
  return tasks.map(task => ({
    ...task,
    // Ensure consistent date formatting
    start_date: task.start_date ? new Date(task.start_date as string).toISOString().split('T')[0] : undefined,
    end_date: task.end_date ? new Date(task.end_date as string).toISOString().split('T')[0] : undefined,
    // Calculate derived fields
    is_overdue: task.is_overdue || (
      task.end_date && 
      task.status !== 'completed' && 
      new Date(task.end_date as string) < new Date()
    ),
    // Normalize status values
    status: task.status || 'unknown',
    // Ensure numeric fields
    progress: typeof task.progress === 'number' ? task.progress : 0,
    estimated_hours: typeof task.estimated_hours === 'number' ? task.estimated_hours : 0
  }))
}

export const processProjectsForExport = (projects: Record<string, unknown>[]) => {
  return projects.map(project => ({
    ...project,
    // Ensure consistent date formatting
    start_date: project.start_date ? new Date(project.start_date as string).toISOString().split('T')[0] : '',
    end_date: project.end_date ? new Date(project.end_date as string).toISOString().split('T')[0] : '',
    // Normalize status values
    status: project.status || 'unknown',
    // Ensure numeric fields
    budget: typeof project.budget === 'number' ? project.budget : 0,
    spent: typeof project.spent === 'number' ? project.spent : 0
  }))
}
