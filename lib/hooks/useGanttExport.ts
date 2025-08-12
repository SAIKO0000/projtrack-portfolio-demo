import { useCallback, useState } from 'react'
import { toast } from 'react-hot-toast'
import type { EnhancedTask } from '@/components/gantt-chart-enhanced-supabase'

interface Project {
  id: string
  name: string
  client?: string
  status: string
  start_date: string
  end_date: string
}

interface ExportData {
  projects: Project[]
  tasks: EnhancedTask[]
  exportType: 'executive' | 'detailed' | 'operational'
  dateRange: {
    start: Date
    end: Date
  }
  filters: {
    projectIds?: string[]
    status?: string[]
    assignees?: string[]
  }
}

export function useGanttExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportData = useCallback(async (
    type: 'executive' | 'detailed' | 'operational',
    projects: Project[],
    tasks: EnhancedTask[],
    projectId?: string
  ) => {
    setIsExporting(true)
    
    try {
      // For now, we'll create a comprehensive data structure that can be used for PDF generation
      const exportData: ExportData = {
        projects,
        tasks,
        exportType: type,
        dateRange: {
          start: new Date(Math.min(...tasks.map(t => new Date(t.start_date || new Date()).getTime()))),
          end: new Date(Math.max(...tasks.map(t => new Date(t.end_date || new Date()).getTime())))
        },
        filters: {
          projectIds: projectId ? [projectId] : projects.map(p => p.id),
          status: [],
          assignees: []
        }
      }

      // Generate different types of exports
      switch (type) {
        case 'executive':
          await generateExecutiveSummary(exportData)
          break
        case 'detailed':
          if (!projectId) {
            throw new Error('Project ID is required for detailed reports')
          }
          await generateDetailedProjectReport(exportData, projectId)
          break
        case 'operational':
          await generateOperationalReport(exportData)
          break
        default:
          throw new Error('Invalid export type')
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report exported successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Failed to export ${type} report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }, [])

  return {
    exportData,
    isExporting
  }
}

// Temporary export functions - these would integrate with the PDF service
async function generateExecutiveSummary(data: ExportData) {
  // Calculate key metrics
  const totalProjects = data.projects.length
  const activeProjects = data.projects.filter(p => p.status === 'in-progress').length
  const completedTasks = data.tasks.filter(t => t.status === 'completed').length
  const totalTasks = data.tasks.length
  const overallProgress = Math.round((completedTasks / totalTasks) * 100)
  const overdueTasks = data.tasks.filter(t => t.is_overdue && t.status !== 'completed')
  const upcomingDeadlines = data.tasks.filter(t => {
    if (!t.end_date) return false
    const endDate = new Date(t.end_date)
    const daysUntil = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntil > 0 && daysUntil <= 7
  })

  // Create a comprehensive text summary
  const summary = `
EXECUTIVE PROJECT SUMMARY
Generated on: ${new Date().toLocaleDateString()}

PROJECT PORTFOLIO OVERVIEW
• Total Projects: ${totalProjects}
• Active Projects: ${activeProjects}
• Overall Progress: ${overallProgress}%
• Projects at Risk: ${data.projects.filter(p => data.tasks.some(t => t.project_id === p.id && t.is_overdue)).length}

CRITICAL INSIGHTS
${overdueTasks.length > 0 ? `⚠ URGENT: ${overdueTasks.length} overdue tasks requiring immediate attention:` : '✓ No overdue tasks'}
${overdueTasks.slice(0, 5).map(task => `  • ${task.title} (${task.project_name})`).join('\n')}

${upcomingDeadlines.length > 0 ? `📅 ${upcomingDeadlines.length} tasks due this week:` : ''}
${upcomingDeadlines.slice(0, 5).map(task => `  • ${task.title} - Due ${new Date(task.end_date!).toLocaleDateString()}`).join('\n')}

PROJECT BREAKDOWN
${data.projects.map(project => {
  const projectTasks = data.tasks.filter(t => t.project_id === project.id)
  const projectCompleted = projectTasks.filter(t => t.status === 'completed').length
  const projectProgress = projectTasks.length > 0 ? Math.round((projectCompleted / projectTasks.length) * 100) : 0
  const projectOverdue = projectTasks.filter(t => t.is_overdue).length
  
  return `• ${project.name} (${project.client || 'No client'}): ${projectProgress}% complete${projectOverdue > 0 ? ` - ${projectOverdue} overdue` : ''}`
}).join('\n')}

HIGH PRIORITY RISKS
• ${data.projects.filter(p => data.tasks.some(t => t.project_id === p.id && t.is_overdue)).length} projects with overdue tasks
• ${data.tasks.filter(t => !t.assignee || t.assignee === 'Unassigned').length} unassigned tasks requiring resource allocation
• ${data.tasks.filter(t => t.status === 'on-hold').length} tasks on hold that may impact deadlines

RECOMMENDATIONS
${overdueTasks.length > 0 ? '• Immediate action required on overdue tasks to prevent project delays' : ''}
${data.tasks.filter(t => !t.assignee).length > 0 ? '• Assign resources to unassigned tasks to maintain project momentum' : ''}
• Regular status reviews recommended for projects with high task counts
• Consider resource reallocation for team members with high workloads
  `

  // For now, download as text file (would be replaced with PDF generation)
  downloadAsTextFile(summary, `executive-summary-${new Date().toISOString().split('T')[0]}.txt`)
}

async function generateDetailedProjectReport(data: ExportData, projectId: string) {
  const project = data.projects.find(p => p.id === projectId)
  const projectTasks = data.tasks.filter(t => t.project_id === projectId)

  if (!project) {
    throw new Error('Project not found')
  }

  const completedTasks = projectTasks.filter(t => t.status === 'completed').length
  const progress = Math.round((completedTasks / projectTasks.length) * 100)
  const overdueTasks = projectTasks.filter(t => t.is_overdue)
  const upcomingTasks = projectTasks.filter(t => {
    if (!t.end_date) return false
    const daysUntil = Math.ceil((new Date(t.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntil > 0 && daysUntil <= 14
  })

  // Group tasks by different dimensions
  const statusBreakdown = groupTasksByField(projectTasks, 'status')
  const phaseBreakdown = groupTasksByField(projectTasks, 'phase')
  const assigneeBreakdown = groupTasksByField(projectTasks, 'assignee')

  const report = `
DETAILED PROJECT REPORT: ${project.name}
Generated on: ${new Date().toLocaleDateString()}

PROJECT SUMMARY
• Client: ${project.client || 'N/A'}
• Status: ${project.status}
• Progress: ${progress}%
• Start Date: ${new Date(project.start_date).toLocaleDateString()}
• End Date: ${new Date(project.end_date).toLocaleDateString()}
• Total Tasks: ${projectTasks.length}
• Completed Tasks: ${completedTasks}
• Overdue Tasks: ${overdueTasks.length}

TASK BREAKDOWN BY STATUS
${Object.entries(statusBreakdown).map(([status, count]) => `• ${status}: ${count} tasks`).join('\n')}

TASK BREAKDOWN BY PHASE
${Object.entries(phaseBreakdown).map(([phase, count]) => `• ${phase || 'No phase'}: ${count} tasks`).join('\n')}

RESOURCE ALLOCATION
${Object.entries(assigneeBreakdown).map(([assignee, count]) => {
  const assigneeTasks = projectTasks.filter(t => t.assignee === assignee)
  const assigneeCompleted = assigneeTasks.filter(t => t.status === 'completed').length
  const assigneeOverdue = assigneeTasks.filter(t => t.is_overdue).length
  return `• ${assignee || 'Unassigned'}: ${count} tasks (${assigneeCompleted} completed, ${assigneeOverdue} overdue)`
}).join('\n')}

DETAILED TASK LIST
${projectTasks.map(task => {
  const startDate = task.start_date ? new Date(task.start_date).toLocaleDateString() : 'TBD'
  const endDate = task.end_date ? new Date(task.end_date).toLocaleDateString() : 'TBD'
  const statusIcon = task.is_overdue ? '🚨' : task.status === 'completed' ? '✅' : task.status === 'in-progress' ? '🔄' : '⏸️'
  
  return `${statusIcon} ${task.title}
    • Dates: ${startDate} - ${endDate}
    • Status: ${task.status}
    • Assignee: ${task.assignee || 'Unassigned'}
    • Phase: ${task.phase || 'N/A'}
    • Progress: ${task.progress || 0}%${task.is_overdue ? ' (OVERDUE)' : ''}`
}).join('\n\n')}

RISK ANALYSIS
${overdueTasks.length > 0 ? `⚠ OVERDUE TASKS (${overdueTasks.length}):` : '✓ No overdue tasks'}
${overdueTasks.map(task => `  • ${task.title} (${Math.abs(task.days_until_deadline || 0)} days overdue)`).join('\n')}

${upcomingTasks.length > 0 ? `📅 UPCOMING DEADLINES (Next 2 weeks):` : ''}
${upcomingTasks.map(task => `  • ${task.title} - Due ${new Date(task.end_date!).toLocaleDateString()}`).join('\n')}

RECOMMENDATIONS
${overdueTasks.length > 0 ? '• Immediate attention required for overdue tasks' : ''}
${projectTasks.filter(t => !t.assignee).length > 0 ? '• Assign resources to unassigned tasks' : ''}
${Object.values(assigneeBreakdown).some(count => count > 5) ? '• Consider workload redistribution for overloaded team members' : ''}
• Regular progress reviews recommended to maintain project momentum
• Update task dependencies to optimize project timeline
  `

  downloadAsTextFile(report, `detailed-project-report-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`)
}

async function generateOperationalReport(data: ExportData) {
  const activeTasks = data.tasks.filter(t => t.status === 'in-progress')
  const urgentTasks = data.tasks.filter(t => 
    t.is_overdue || 
    (t.end_date && Math.ceil((new Date(t.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 3)
  )
  const upcomingTasks = data.tasks.filter(t => {
    if (!t.start_date) return false
    const startDate = new Date(t.start_date)
    const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntil >= 0 && daysUntil <= 14
  })

  const assignees = [...new Set(data.tasks.map(t => t.assignee).filter(Boolean))]
  const assigneeWorkload = groupTasksByField(activeTasks, 'assignee')

  const report = `
OPERATIONAL DASHBOARD REPORT
Generated on: ${new Date().toLocaleDateString()}
Period: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}

IMMEDIATE ACTIONS REQUIRED
🚨 ${urgentTasks.length} Urgent Tasks Requiring Immediate Attention:
${urgentTasks.slice(0, 8).map(task => {
  const status = task.is_overdue ? 'OVERDUE' : 'DUE SOON'
  return `  • [${status}] ${task.title} - ${task.assignee || 'Unassigned'} (${task.project_name})`
}).join('\n')}

TEAM PERFORMANCE OVERVIEW
${assignees.map(assignee => {
  const assigneeTasks = data.tasks.filter(t => t.assignee === assignee)
  const completed = assigneeTasks.filter(t => t.status === 'completed').length
  const total = assigneeTasks.length
  const completionRate = Math.round((completed / total) * 100)
  const overdue = assigneeTasks.filter(t => t.is_overdue).length
  
  return `• ${assignee}: ${completionRate}% completion rate (${completed}/${total} tasks)${overdue > 0 ? ` - ${overdue} overdue` : ''}`
}).join('\n')}

RESOURCE UTILIZATION
Current Active Task Distribution:
${Object.entries(assigneeWorkload).map(([assignee, count]) => {
  const workloadLevel = count > 5 ? 'HIGH' : count > 2 ? 'MEDIUM' : 'LOW'
  return `• ${assignee || 'Unassigned'}: ${count} active tasks (${workloadLevel} workload)`
}).join('\n')}

UPCOMING PRIORITIES (Next 2 Weeks)
📅 Tasks Starting Soon:
${upcomingTasks.slice(0, 10).map(task => {
  const startDate = new Date(task.start_date!).toLocaleDateString()
  return `  • ${task.title} - Starts ${startDate} (${task.assignee || 'Unassigned'})`
}).join('\n')}

CAPACITY PLANNING INSIGHTS
• High workload team members: ${Object.entries(assigneeWorkload).filter(([, count]) => count > 5).map(([name]) => name).join(', ') || 'None'}
• Available capacity: ${assignees.filter(assignee => (assigneeWorkload[assignee] || 0) < 3).join(', ') || 'Limited'}
• Unassigned tasks: ${data.tasks.filter(t => !t.assignee || t.assignee === 'Unassigned').length}

OPERATIONAL RECOMMENDATIONS
• Prioritize overdue task resolution to prevent project delays
• Balance workload distribution among team members
• Assign unassigned tasks to available resources
• Schedule regular check-ins for high-priority tasks
• Consider additional resources for overloaded team members
  `

  downloadAsTextFile(report, `operational-report-${new Date().toISOString().split('T')[0]}.txt`)
}

function groupTasksByField(tasks: EnhancedTask[], field: keyof EnhancedTask): Record<string, number> {
  return tasks.reduce((acc, task) => {
    const value = task[field] as string || 'Unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function downloadAsTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
