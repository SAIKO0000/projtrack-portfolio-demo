import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'

// Types for PDF export data
export interface GanttExportData {
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

export interface ExportOptions {
  includeCharts: boolean
  includeTimeline: boolean
  includeResourceAnalysis: boolean
  includeBudgetInfo: boolean
  format: 'pdf' | 'excel' | 'csv'
  orientation: 'portrait' | 'landscape'
}

export class PDFExportService {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
  }

  async generateExecutiveSummary(data: GanttExportData): Promise<Blob> {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    
    // Header
    this.addHeader('Executive Project Summary')
    this.addSubheader(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`)
    
    // Key Metrics Section
    this.addSection('Project Portfolio Overview', 20)
    this.addMetricsGrid(this.calculateExecutiveMetrics(data))
    
    // Critical Insights
    this.addSection('Critical Insights & Actions Required', 60)
    this.addCriticalInsights(data)
    
    // Timeline Overview
    this.addSection('Project Timeline Overview', 120)
    await this.addTimelineChart(data)
    
    // Risk Assessment
    this.addSection('Risk Assessment', 180)
    this.addRiskSummary(data)
    
    return this.doc.output('blob')
  }

  async generateDetailedProjectReport(projectId: string, data: GanttExportData): Promise<Blob> {
    this.doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    
    const project = data.projects.find(p => p.id === projectId)
    const projectTasks = data.tasks.filter(t => t.project_id === projectId)
    
    if (!project) throw new Error('Project not found')
    
    // Page 1: Project Overview
    this.addHeader(`${project.name} - Detailed Report`)
    this.addProjectSummary(project, projectTasks)
    
    // Page 2: Gantt Chart
    this.doc.addPage()
    this.addSection('Project Timeline (Gantt Chart)', 20)
    await this.addFullGanttChart(projectTasks)
    
    // Page 3: Task Breakdown
    this.doc.addPage()
    this.addSection('Task Analysis', 20)
    this.addTaskBreakdown(projectTasks)
    
    // Page 4: Resource Allocation
    this.doc.addPage()
    this.addSection('Resource Allocation', 20)
    this.addResourceAnalysis(projectTasks)
    
    // Page 5: Risk & Recommendations
    this.doc.addPage()
    this.addSection('Risk Analysis & Recommendations', 20)
    this.addDetailedRiskAnalysis(projectTasks)
    
    return this.doc.output('blob')
  }

  async generateOperationalReport(data: GanttExportData): Promise<Blob> {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    
    // Header
    this.addHeader('Operational Dashboard Report')
    this.addSubheader(`Period: ${format(data.dateRange.start, 'MMM dd')} - ${format(data.dateRange.end, 'MMM dd, yyyy')}`)
    
    // Immediate Actions Required
    this.addSection('Immediate Actions Required', 25)
    this.addImmediateActions(data)
    
    // Team Performance
    this.addSection('Team Performance Overview', 80)
    this.addTeamPerformance(data)
    
    // Resource Utilization
    this.addSection('Resource Utilization', 140)
    this.addResourceUtilization(data)
    
    // Upcoming Priorities
    this.addSection('Upcoming Priorities (Next 2 Weeks)', 200)
    this.addUpcomingPriorities(data)
    
    return this.doc.output('blob')
  }

  private addHeader(title: string) {
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, 20, 20)
    this.doc.setDrawColor(0, 0, 0)
    this.doc.line(20, 25, 190, 25)
  }

  private addSubheader(subtitle: string) {
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    this.doc.text(subtitle, 20, 32)
    this.doc.setTextColor(0, 0, 0)
  }

  private addSection(title: string, yPosition: number) {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, 20, yPosition)
    this.doc.line(20, yPosition + 2, 190, yPosition + 2)
  }

  private addMetricsGrid(metrics: any) {
    const startY = 30
    const colWidth = 42
    const rowHeight = 25
    
    const metricsData = [
      ['Total Projects', metrics.totalProjects],
      ['Active Projects', metrics.activeProjects],
      ['Overall Progress', `${metrics.overallProgress}%`],
      ['Projects at Risk', metrics.projectsAtRisk]
    ]

    metricsData.forEach((metric, index) => {
      const col = index % 4
      const row = Math.floor(index / 4)
      const x = 20 + (col * colWidth)
      const y = startY + (row * rowHeight)
      
      // Metric box
      this.doc.setDrawColor(200, 200, 200)
      this.doc.rect(x, y, colWidth - 5, rowHeight - 5)
      
      // Metric label
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(metric[0], x + 2, y + 8)
      
      // Metric value
      this.doc.setFontSize(16)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(metric[1].toString(), x + 2, y + 16)
    })
  }

  private calculateExecutiveMetrics(data: GanttExportData) {
    const totalProjects = data.projects.length
    const activeProjects = data.projects.filter(p => p.status === 'in-progress').length
    const completedTasks = data.tasks.filter(t => t.status === 'completed').length
    const totalTasks = data.tasks.length
    const overallProgress = Math.round((completedTasks / totalTasks) * 100)
    const projectsAtRisk = data.tasks.filter(t => t.is_overdue).map(t => t.project_id)
      .filter((id, index, self) => self.indexOf(id) === index).length

    return {
      totalProjects,
      activeProjects,
      overallProgress,
      projectsAtRisk
    }
  }

  private addCriticalInsights(data: GanttExportData) {
    const overdueTasks = data.tasks.filter(t => t.is_overdue && t.status !== 'completed')
    const upcomingDeadlines = data.tasks.filter(t => {
      if (!t.end_date) return false
      const endDate = new Date(t.end_date)
      const daysUntil = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil > 0 && daysUntil <= 7
    })

    let yPos = 70

    // Overdue Tasks
    if (overdueTasks.length > 0) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(220, 53, 69)
      this.doc.text(`⚠ ${overdueTasks.length} Overdue Tasks Requiring Immediate Attention`, 25, yPos)
      yPos += 8

      overdueTasks.slice(0, 3).forEach(task => {
        this.doc.setFontSize(10)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(0, 0, 0)
        this.doc.text(`• ${task.title} (${task.project_name})`, 30, yPos)
        yPos += 6
      })
      yPos += 5
    }

    // Upcoming Deadlines
    if (upcomingDeadlines.length > 0) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(255, 193, 7)
      this.doc.text(`📅 ${upcomingDeadlines.length} Tasks Due This Week`, 25, yPos)
      yPos += 8

      upcomingDeadlines.slice(0, 3).forEach(task => {
        this.doc.setFontSize(10)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(0, 0, 0)
        const dueDate = format(new Date(task.end_date!), 'MMM dd')
        this.doc.text(`• ${task.title} - Due ${dueDate}`, 30, yPos)
        yPos += 6
      })
    }
  }

  private async addTimelineChart(data: GanttExportData) {
    // This would integrate with the actual Gantt chart component
    // For now, we'll add a placeholder
    this.doc.setFontSize(10)
    this.doc.text('Timeline chart would be rendered here using canvas capture', 25, 140)
  }

  private addRiskSummary(data: GanttExportData) {
    const delayedProjects = data.projects.filter(project => {
      const projectTasks = data.tasks.filter(t => t.project_id === project.id)
      return projectTasks.some(t => t.is_overdue)
    })

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('High Priority Risks:', 25, 190)

    let yPos = 200
    if (delayedProjects.length > 0) {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(220, 53, 69)
      this.doc.text(`• ${delayedProjects.length} projects with overdue tasks`, 30, yPos)
      yPos += 8
    }

    const unassignedTasks = data.tasks.filter(t => !t.assignee || t.assignee === 'Unassigned')
    if (unassignedTasks.length > 0) {
      this.doc.setTextColor(255, 193, 7)
      this.doc.text(`• ${unassignedTasks.length} unassigned tasks requiring resource allocation`, 30, yPos)
      yPos += 8
    }

    // Reset text color
    this.doc.setTextColor(0, 0, 0)
  }

  private addProjectSummary(project: any, tasks: any[]) {
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const progress = Math.round((completedTasks / tasks.length) * 100)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Project Summary', 20, 35)
    
    const summaryData = [
      ['Client:', project.client || 'N/A'],
      ['Status:', project.status],
      ['Progress:', `${progress}%`],
      ['Start Date:', format(new Date(project.start_date), 'MMM dd, yyyy')],
      ['End Date:', format(new Date(project.end_date), 'MMM dd, yyyy')],
      ['Total Tasks:', tasks.length.toString()],
      ['Completed:', completedTasks.toString()],
      ['Overdue:', tasks.filter(t => t.is_overdue).length.toString()]
    ]

    let yPos = 45
    summaryData.forEach(([label, value]) => {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label, 25, yPos)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value, 65, yPos)
      yPos += 8
    })
  }

  private addTaskBreakdown(tasks: any[]) {
    // Add task breakdown by status, phase, assignee
    const statusBreakdown = this.groupTasksByField(tasks, 'status')
    const phaseBreakdown = this.groupTasksByField(tasks, 'phase')
    const assigneeBreakdown = this.groupTasksByField(tasks, 'assignee')

    let yPos = 35

    // Status breakdown
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Tasks by Status', 25, yPos)
    yPos += 10

    Object.entries(statusBreakdown).forEach(([status, count]) => {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`${status}: ${count} tasks`, 30, yPos)
      yPos += 6
    })

    yPos += 10

    // Phase breakdown
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Tasks by Phase', 25, yPos)
    yPos += 10

    Object.entries(phaseBreakdown).forEach(([phase, count]) => {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`${phase}: ${count} tasks`, 30, yPos)
      yPos += 6
    })
  }

  private groupTasksByField(tasks: any[], field: string): Record<string, number> {
    return tasks.reduce((acc, task) => {
      const value = task[field] || 'Unassigned'
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }

  private addResourceAnalysis(tasks: any[]) {
    const assigneeWorkload = this.groupTasksByField(tasks, 'assignee')
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Resource Allocation', 25, 35)
    
    let yPos = 45
    Object.entries(assigneeWorkload).forEach(([assignee, count]) => {
      const assigneeTasks = tasks.filter(t => t.assignee === assignee)
      const completed = assigneeTasks.filter(t => t.status === 'completed').length
      const overdue = assigneeTasks.filter(t => t.is_overdue).length
      
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(assignee, 30, yPos)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`${count} tasks (${completed} completed, ${overdue} overdue)`, 80, yPos)
      yPos += 8
    })
  }

  private addDetailedRiskAnalysis(tasks: any[]) {
    const overdueTasks = tasks.filter(t => t.is_overdue)
    const upcomingTasks = tasks.filter(t => {
      if (!t.end_date) return false
      const daysUntil = Math.ceil((new Date(t.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil > 0 && daysUntil <= 14
    })

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Risk Analysis', 25, 35)

    let yPos = 50

    if (overdueTasks.length > 0) {
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(220, 53, 69)
      this.doc.text('Overdue Tasks:', 30, yPos)
      yPos += 8

      overdueTasks.forEach(task => {
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(0, 0, 0)
        const daysOverdue = Math.abs(task.days_until_deadline || 0)
        this.doc.text(`• ${task.title} (${daysOverdue} days overdue)`, 35, yPos)
        yPos += 6
      })
      yPos += 5
    }

    if (upcomingTasks.length > 0) {
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(255, 193, 7)
      this.doc.text('Upcoming Deadlines (Next 2 Weeks):', 30, yPos)
      yPos += 8

      upcomingTasks.forEach(task => {
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(0, 0, 0)
        const dueDate = format(new Date(task.end_date!), 'MMM dd')
        this.doc.text(`• ${task.title} - Due ${dueDate}`, 35, yPos)
        yPos += 6
      })
    }

    // Reset text color
    this.doc.setTextColor(0, 0, 0)
  }

  private addImmediateActions(data: GanttExportData) {
    // Implementation for operational report immediate actions
    const urgentTasks = data.tasks.filter(t => 
      t.is_overdue || 
      (t.end_date && Math.ceil((new Date(t.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 3)
    )

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(220, 53, 69)
    this.doc.text(`🚨 ${urgentTasks.length} Urgent Actions Required`, 25, 40)

    let yPos = 50
    urgentTasks.slice(0, 5).forEach(task => {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(0, 0, 0)
      const status = task.is_overdue ? 'OVERDUE' : 'DUE SOON'
      this.doc.text(`• [${status}] ${task.title} - ${task.assignee}`, 30, yPos)
      yPos += 6
    })

    this.doc.setTextColor(0, 0, 0)
  }

  private addTeamPerformance(data: GanttExportData) {
    // Team performance metrics
    const assignees = [...new Set(data.tasks.map(t => t.assignee).filter(Boolean))]
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Team Performance Metrics', 25, 95)

    let yPos = 105
    assignees.forEach(assignee => {
      const assigneeTasks = data.tasks.filter(t => t.assignee === assignee)
      const completed = assigneeTasks.filter(t => t.status === 'completed').length
      const total = assigneeTasks.length
      const completionRate = Math.round((completed / total) * 100)

      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`${assignee}: ${completionRate}% completion rate (${completed}/${total})`, 30, yPos)
      yPos += 6
    })
  }

  private addResourceUtilization(data: GanttExportData) {
    // Resource utilization analysis
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Resource Utilization Analysis', 25, 155)

    const activeTasks = data.tasks.filter(t => t.status === 'in-progress')
    const assigneeWorkload = this.groupTasksByField(activeTasks, 'assignee')

    let yPos = 165
    Object.entries(assigneeWorkload).forEach(([assignee, count]) => {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      const workloadLevel = count > 5 ? 'High' : count > 2 ? 'Medium' : 'Low'
      this.doc.text(`${assignee}: ${count} active tasks (${workloadLevel} workload)`, 30, yPos)
      yPos += 6
    })
  }

  private addUpcomingPriorities(data: GanttExportData) {
    const upcomingTasks = data.tasks.filter(t => {
      if (!t.start_date) return false
      const startDate = new Date(t.start_date)
      const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil >= 0 && daysUntil <= 14
    })

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Upcoming Priorities (Next 2 Weeks)', 25, 215)

    let yPos = 225
    upcomingTasks.slice(0, 8).forEach(task => {
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'normal')
      const startDate = format(new Date(task.start_date!), 'MMM dd')
      this.doc.text(`• ${task.title} - Starts ${startDate} (${task.assignee})`, 30, yPos)
      yPos += 5
    })
  }

  private async addFullGanttChart(tasks: any[]) {
    // This would capture the actual Gantt chart component
    // For now, we'll add a placeholder
    this.doc.setFontSize(10)
    this.doc.text('Full Gantt chart visualization would be captured here', 25, 40)
    
    // Add a simple task list as placeholder
    let yPos = 60
    tasks.forEach(task => {
      const startDate = task.start_date ? format(new Date(task.start_date), 'MMM dd') : 'TBD'
      const endDate = task.end_date ? format(new Date(task.end_date), 'MMM dd') : 'TBD'
      
      this.doc.setFontSize(8)
      this.doc.text(`${task.title}: ${startDate} - ${endDate} (${task.status})`, 25, yPos)
      yPos += 5
      
      if (yPos > 180) { // If we're near the bottom of the page
        this.doc.addPage()
        yPos = 30
      }
    })
  }
}

// Export utility functions
export const exportGanttToPDF = async (
  data: GanttExportData, 
  type: 'executive' | 'detailed' | 'operational',
  projectId?: string
): Promise<void> => {
  const service = new PDFExportService()
  let blob: Blob

  switch (type) {
    case 'executive':
      blob = await service.generateExecutiveSummary(data)
      break
    case 'detailed':
      if (!projectId) throw new Error('Project ID required for detailed report')
      blob = await service.generateDetailedProjectReport(projectId, data)
      break
    case 'operational':
      blob = await service.generateOperationalReport(data)
      break
    default:
      throw new Error('Invalid export type')
  }

  // Download the PDF
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `gantt-${type}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
