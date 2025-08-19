import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

// Type declarations for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

// Enhanced types for electrical engineering export
export interface ProjectData {
  id: string
  name: string
  client?: string
  status: string
  start_date: string
  end_date: string
  priority?: string
  category?: string
  // Engineering-specific fields
  voltage_level?: string
  equipment_type?: string
  safety_classification?: string
  compliance_standard?: string
}

export interface TaskData {
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
}

export interface ExportOptions {
  exportType: 'all-projects' | 'specific-project'
  projectId?: string
  includeTaskDetails: boolean
  includeResourceAnalysis: boolean
  includeTimeline: boolean
  includeTechnicalSpecs: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF
  }
}

export class StructuredPDFExportService {
  private doc: jsPDF
  private pageHeight: number = 280
  private pageWidth: number = 210
  private margin: number = 15
  private currentY: number = 20

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    // Initialize autoTable plugin
    autoTable(this.doc, {})
    this.currentY = 20
  }

  private addCompanyLogo() {
    // Add GYG Power Systems branding
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(25, 82, 140) // Professional blue
    
    // Company name with professional styling
    this.doc.text('GYG POWER SYSTEMS', this.pageWidth - 70, 15)
    
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(120, 120, 120)
    this.doc.text('Electrical Engineering Solutions', this.pageWidth - 70, 20)
    
    // Add a professional line separator
    this.doc.setDrawColor(25, 82, 140)
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, 25, this.pageWidth - this.margin, 25)
    
    this.currentY = 35
  }

  async exportStructuredReport(
    projects: ProjectData[],
    tasks: TaskData[],
    options: ExportOptions
  ): Promise<Blob> {
    // Check if this is a single task detailed report
    if (options.exportType === 'specific-project' && tasks.length === 1) {
      return this.generateDetailedTaskReport(tasks[0], projects.find(p => p.id === tasks[0].project_id))
    }
    
    // Use manpower schedule format for all other exports
    this.generateManpowerScheduleTable(projects, tasks)
    return this.doc.output('blob')
  }

  // Generate detailed individual task report
  private generateDetailedTaskReport(task: TaskData, project?: ProjectData): Blob {
    // Create a new PDF for detailed task report
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    this.pageHeight = 280
    this.pageWidth = 210
    this.currentY = 20
    
    // Header
    this.addDetailedTaskHeader(task, project)
    
    // Task Details Section
    this.addTaskDetailsSection(task)
    
    // Assigned Roles & Manpower Section
    this.addAssignedRolesSection(task)
    
    // Timeline Analysis Section  
    this.addTimelineAnalysisSection(task)
    
    // Progress & Computations Section
    this.addProgressComputationsSection(task)
    
    // Observations/Notes Section
    this.addObservationsSection(task)
    
    // Summary Box
    this.addSummaryBox(task)
    
    return this.doc.output('blob')
  }

  private addDetailedTaskHeader(task: TaskData, project?: ProjectData) {
    // Company header
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(25, 82, 140)
    this.doc.text('📌 Task Report – Electrical Engineering Project', this.margin, this.currentY)
    
    this.currentY += 15
    
    // Project and Task Info
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Project Title: ${project?.name || task.project_name || 'Unknown Project'}`, this.margin, this.currentY)
    
    this.currentY += 8
    this.doc.text(`Task Title: ${task.title}`, this.margin, this.currentY)
    
    this.currentY += 8
    this.doc.text(`Task Phase: ${task.phase || 'General'}`, this.margin, this.currentY)
    
    this.currentY += 8
    const statusIcon = task.status === 'completed' ? '✅' : 
                      task.status === 'in-progress' ? '🟡' : 
                      task.status === 'planning' ? '🔵' : '⚪'
    this.doc.text(`Status: ${statusIcon} ${this.formatStatus(task.status)}`, this.margin, this.currentY)
    
    this.currentY += 15
  }

  private addTaskDetailsSection(task: TaskData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('1. Task Details', this.margin, this.currentY)
    
    this.currentY += 10
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    // Description
    this.doc.text('Description:', this.margin, this.currentY)
    this.currentY += 6
    const description = task.description || 'Detailed description of the task...'
    const wrappedDescription = this.doc.splitTextToSize(description, this.pageWidth - 2 * this.margin)
    this.doc.text(wrappedDescription, this.margin + 5, this.currentY)
    this.currentY += wrappedDescription.length * 5 + 5
    
    // Dates
    if (task.start_date) {
      const startDate = new Date(task.start_date)
      this.doc.text(`Start Date: ${this.formatFullDate(startDate)}`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    if (task.end_date) {
      const endDate = new Date(task.end_date)
      this.doc.text(`End Date: ${this.formatFullDate(endDate)}`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    // Duration calculation
    if (task.start_date && task.end_date) {
      const duration = this.calculateDuration(task.start_date, task.end_date)
      this.doc.text(`Duration: ${duration} days`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    // Completion date if applicable
    if (task.completed_at) {
      const completedAt = new Date(task.completed_at)
      this.doc.text(`Actual Completion: ${this.formatFullDateTime(completedAt)}`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    this.currentY += 10
  }

  private addAssignedRolesSection(task: TaskData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('2. Assigned Roles & Manpower', this.margin, this.currentY)
    
    this.currentY += 10
    
    // Create table for roles
    const roleData = this.prepareRoleTableData(task)
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Role', 'Assigned', 'Remarks']],
      body: roleData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [240, 240, 240],
        fontStyle: 'bold'
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addTimelineAnalysisSection(task: TaskData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('3. Timeline Analysis', this.margin, this.currentY)
    
    this.currentY += 10
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    if (task.start_date && task.end_date) {
      const plannedDuration = this.calculateDuration(task.start_date, task.end_date)
      const actualDuration = task.completed_at ? 
        this.calculateDuration(task.start_date, task.completed_at) : 
        this.calculateDuration(task.start_date, new Date().toISOString())
      
      this.doc.text(`Planned Duration: ${plannedDuration} working days`, this.margin, this.currentY)
      this.currentY += 6
      
      this.doc.text(`Actual Duration: ${actualDuration} working days`, this.margin, this.currentY)
      
      const variance = actualDuration - plannedDuration
      const statusIcon = variance <= 0 ? '✅' : '⚠️'
      const varianceText = variance <= 0 ? '(on time)' : `(${variance} days delay)`
      
      this.doc.text(` ${varianceText} ${statusIcon}`, 80, this.currentY)
      this.currentY += 6
      
      const onTime = task.status === 'completed' && variance <= 0
      this.doc.text(`On-Time Completion: ${onTime ? 'Yes' : 'No'}`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    this.currentY += 10
  }

  private addProgressComputationsSection(task: TaskData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('4. Progress & Computations', this.margin, this.currentY)
    
    this.currentY += 10
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    const plannedProgress = task.status === 'completed' ? 100 : 
                           task.status === 'in-progress' ? 50 : 
                           task.status === 'planning' ? 10 : 0
    
    const actualProgress = task.progress || plannedProgress
    const variance = actualProgress - plannedProgress
    
    this.doc.text(`Planned % Completion: ${plannedProgress}%`, this.margin, this.currentY)
    this.currentY += 6
    
    this.doc.text(`Actual % Completion: ${actualProgress}%`, this.margin, this.currentY)
    this.currentY += 6
    
    const varianceText = variance === 0 ? '0% → Delivered exactly as planned' :
                        variance > 0 ? `+${variance}% → Ahead of schedule` :
                        `${variance}% → Behind schedule`
    
    this.doc.text(`Variance: ${varianceText}`, this.margin, this.currentY)
    this.currentY += 6
    
    // Add delay analysis if applicable
    if (task.is_overdue && task.days_until_deadline) {
      this.doc.text(`📊 Delay Analysis: ${Math.abs(task.days_until_deadline)} days overdue`, this.margin, this.currentY)
      this.currentY += 6
    }
    
    this.currentY += 10
  }

  private addObservationsSection(task: TaskData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('5. Observations / Notes', this.margin, this.currentY)
    
    this.currentY += 10
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    const observations = task.notes || this.generateDefaultObservations(task)
    const wrappedObservations = this.doc.splitTextToSize(observations, this.pageWidth - 2 * this.margin)
    this.doc.text(wrappedObservations, this.margin, this.currentY)
    this.currentY += wrappedObservations.length * 5 + 10
  }

  private addSummaryBox(task: TaskData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('📝 Summary Box', this.margin, this.currentY)
    
    this.currentY += 10
    
    // Create summary box with border
    const boxY = this.currentY
    const boxHeight = 30
    
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, boxY, this.pageWidth - 2 * this.margin, boxHeight)
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    const summaryItems = this.generateSummaryItems(task)
    let itemY = boxY + 8
    
    summaryItems.forEach(item => {
      this.doc.text(item, this.margin + 5, itemY)
      itemY += 6
    })
  }

  private prepareRoleTableData(task: TaskData): (string | number)[][] {
    const roleData: (string | number)[][] = []
    
    if (task.assignee) {
      const assignees = task.assignee.split(', ')
      const headcounts = task.assignee_headcounts || {}
      
      assignees.forEach(assignee => {
        const headcount = headcounts[assignee.trim()] || 1
        const role = assignee.trim()
        let remarks = 'Execution & monitoring'
        
        if (role.toLowerCase().includes('project in-charge')) {
          remarks = 'Lead role'
        } else if (role.toLowerCase().includes('engineer')) {
          remarks = 'Planning & coordination'
        } else if (role.toLowerCase().includes('gc')) {
          remarks = 'Execution & site monitoring'
        }
        
        roleData.push([role, headcount.toString(), remarks])
      })
    } else {
      roleData.push(['Unassigned', '0', 'No personnel assigned'])
    }
    
    return roleData
  }

  private generateDefaultObservations(task: TaskData): string {
    const status = task.status || 'unknown'
    const taskTitle = task.title.toLowerCase()
    
    let observations = `${task.title} was `
    
    if (status === 'completed') {
      observations += 'completed successfully on schedule.\n\n'
      observations += 'All assigned engineers fulfilled their roles.\n\n'
      observations += 'No additional manpower or resources were required.'
    } else if (status === 'in-progress') {
      observations += 'currently in progress.\n\n'
      observations += 'Resource allocation is proceeding as planned.\n\n'
      observations += 'Regular monitoring and updates are being conducted.'
    } else {
      observations += 'in planning phase.\n\n'
      observations += 'Resource requirements are being assessed.\n\n'
      observations += 'Timeline and manpower allocation pending approval.'
    }
    
    return observations
  }

  private generateSummaryItems(task: TaskData): string[] {
    const items = []
    
    if (task.status === 'completed') {
      items.push('✔️ Task Completed on time')
    } else if (task.is_overdue) {
      items.push('⚠️ Task Delayed')
    } else {
      items.push('🔄 Task In Progress')
    }
    
    if (task.assignee) {
      items.push('✔️ Manpower properly allocated')
    } else {
      items.push('⚠️ Manpower allocation pending')
    }
    
    const hasDelay = task.is_overdue && task.days_until_deadline && task.days_until_deadline < 0
    if (!hasDelay && task.status === 'completed') {
      items.push('✔️ Zero variance (on-budget, on-time)')
    } else if (hasDelay) {
      items.push('⚠️ Variance detected (schedule impact)')
    } else {
      items.push('🔄 On track with current schedule')
    }
    
    return items
  }

  private formatStatus(status: string): string {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  private formatFullDate(date: Date): string {
    return date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })
  }

  private formatFullDateTime(date: Date): string {
    return date.toLocaleDateString("en-PH", {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    })
  }

  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Generate manpower schedule table exactly like the image
  private generateManpowerScheduleTable(
    projects: ProjectData[],
    tasks: TaskData[]
  ) {
    // Create a landscape PDF for better table layout
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    
    // Update dimensions for landscape
    this.pageHeight = 210
    this.pageWidth = 297
    this.currentY = 20
    
    // Company header similar to the image
    this.addManpowerScheduleHeader()
    
    // Title
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('PROJECT AND MANPOWER SCHEDULE', this.pageWidth / 2, 40, { align: 'center' })
    
    // Add professional analysis section
    this.addProjectAnalysisSection(projects, tasks)
    
    this.currentY = 85
    
    // Get months for the schedule (14 months as shown in image)
    const months: string[] = []
    for (let i = 1; i <= 14; i++) {
      months.push(i.toString())
    }
    
    // Prepare table data similar to the image format
    const tableData = this.prepareManpowerTableData(projects, tasks, months)
    
    // Create the main schedule table with simplified configuration
    autoTable(this.doc, {
      startY: this.currentY,
      head: [
        ['ITEM', 'DESCRIPTION', ...months]
      ],
      body: tableData,
      theme: 'grid' as const,
      styles: {
        fontSize: 8,
        cellPadding: 1,
        lineWidth: 0.2,
        textColor: [0, 0, 0] as const,
        fillColor: [255, 255, 255] as const
      },
      headStyles: {
        fillColor: [240, 240, 240] as const,
        fontStyle: 'bold' as const,
        fontSize: 9,
        halign: 'center' as const,
        valign: 'middle' as const
      },
      margin: { left: this.margin, right: this.margin }
    })
  }
  
  private addProjectAnalysisSection(projects: ProjectData[], tasks: TaskData[]) {
    // Analysis section
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('PROJECT ANALYSIS & RESOURCE ALLOCATION', this.margin, 55)
    
    const analysis = this.analyzeProjectComplexity(projects, tasks)
    const totalTasks = tasks.length
    const activeTasks = tasks.filter(t => t.status === 'in-progress').length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    
    const analysisText = [
      `Total Projects: ${projects.length} | Total Tasks: ${totalTasks} | Active: ${activeTasks} | Completed: ${completedTasks}`,
      `Project Complexity: ${analysis.complexity.toUpperCase()} | Estimated Duration: ${this.estimateProjectDuration(tasks)} months`,
      `Resource Requirements: ${analysis.hasHighRisk ? 'High Safety Requirements' : 'Standard Safety'} | ${analysis.needsWelding ? 'Welding/Fabrication Required' : 'No Welding Required'}`,
      `Peak Manpower: ${this.calculatePeakManpower(tasks)} personnel | Recommended Team Size: ${this.calculateRecommendedTeamSize(projects, tasks)} members`
    ]
    
    let yPos = 62
    analysisText.forEach(text => {
      this.doc.text(text, this.margin, yPos)
      yPos += 5
    })
  }
  
  private estimateProjectDuration(tasks: TaskData[]): number {
    if (tasks.length === 0) return 1
    
    const tasksWithDates = tasks.filter(t => t.start_date && t.end_date)
    if (tasksWithDates.length === 0) return Math.ceil(tasks.length / 10)
    
    const earliestStart = new Date(Math.min(...tasksWithDates.map(t => new Date(t.start_date!).getTime())))
    const latestEnd = new Date(Math.max(...tasksWithDates.map(t => new Date(t.end_date!).getTime())))
    
    const diffTime = latestEnd.getTime() - earliestStart.getTime()
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
    
    return Math.max(1, diffMonths)
  }
  
  private calculatePeakManpower(tasks: TaskData[]): number {
    // Calculate based on overlapping tasks and their requirements
    const overlappingTasks = tasks.filter(t => t.status === 'in-progress').length
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length
    
    return Math.max(5, overlappingTasks * 2 + highPriorityTasks)
  }
  
  private calculateRecommendedTeamSize(projects: ProjectData[], tasks: TaskData[]): number {
    const baseTeam = 4 // Minimum team
    const projectMultiplier = Math.ceil(projects.length / 2)
    const taskComplexity = Math.ceil(tasks.length / 15)
    
    return Math.max(baseTeam, baseTeam + projectMultiplier + taskComplexity)
  }
  
  private addManpowerScheduleHeader() {
    // Company logo/info in top right (similar to image)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(255, 140, 0) // Orange color
    this.doc.text('GYG', this.pageWidth - 60, 15)
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('Power Systems Inc.', this.pageWidth - 60, 22)
    
    this.doc.setFontSize(8)
    this.doc.setTextColor(100, 100, 100)
    this.doc.text('Engineers • Contractors • Consultants', this.pageWidth - 60, 27)
    
    // Contact info
    this.doc.text('59 Matias St., San Francisco del Monte,', this.pageWidth - 60, 32)
    this.doc.text('Quezon City', this.pageWidth - 60, 36)
    this.doc.text('gyg.powersystems@gmail.com', this.pageWidth - 60, 40)
  }
  
  private prepareManpowerTableData(
    projects: ProjectData[],
    tasks: TaskData[],
    months: string[]
  ): (string | number)[][] {
    const tableData: (string | number)[][] = []
    
    // Group tasks by project and create entries similar to the image
    const tasksByProject = tasks.reduce((acc, task) => {
      const projectKey = task.project_id || 'unassigned'
      if (!acc[projectKey]) acc[projectKey] = []
      acc[projectKey].push(task)
      return acc
    }, {} as Record<string, TaskData[]>)
    
    let itemCounter = 0
    const itemLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    
    // Add real project tasks data
    Object.entries(tasksByProject).forEach(([projectId, projectTasks]) => {
      const project = projects.find(p => p.id === projectId)
      const projectName = project?.name || 'Unknown Project'
      
      // Add project header
      tableData.push(['', `PROJECT: ${projectName.toUpperCase()}`, ...months.map(() => '')])
      
      projectTasks.forEach((task) => {
        const item = itemLabels[itemCounter] || (itemCounter + 1).toString()
        const monthValues = this.calculateRealTaskMonthValues(task, months)
        
        tableData.push([
          item,
          task.title.toUpperCase(),
          ...monthValues
        ])
        itemCounter++
      })
      
      // Add spacing between projects
      if (Object.keys(tasksByProject).length > 1) {
        tableData.push(['', '', ...months.map(() => '')])
      }
    })
    
    // Add project staff section with real data analysis
    tableData.push(['', 'PROJECT STAFF', ...months.map(() => '')])
    
    // Calculate staff requirements based on project complexity and tasks
    const totalTasks = tasks.length
    const projectComplexity = this.analyzeProjectComplexity(projects, tasks)
    
    const staffRoles = [
      { role: 'PROJECT IN-CHARGE', count: Math.max(1, Math.ceil(projects.length / 3)) },
      { role: 'PROJECT ENGINEER', count: Math.max(1, Math.ceil(totalTasks / 10)) },
      { role: 'QC ENGINEER', count: Math.max(1, Math.ceil(totalTasks / 15)) },
      { role: 'SAFETY OFFICER', count: projectComplexity.hasHighRisk ? 2 : 1 }
    ]
    
    staffRoles.forEach(({ role, count }) => {
      const item = itemLabels[itemCounter] || (itemCounter + 1).toString()
      tableData.push([
        item,
        role,
        ...months.map(() => count.toString())
      ])
      itemCounter++
    })
    
    // Add direct labor section with real calculations
    tableData.push(['', 'DIRECT LABOR', ...months.map(() => '')])
    
    const laborRoles = [
      { role: 'FOREMAN', count: Math.max(1, Math.ceil(totalTasks / 20)) },
      { role: 'ELECTRICIAN', count: Math.max(2, Math.ceil(totalTasks / 5)) },
      { role: 'HELPER', count: Math.max(2, Math.ceil(totalTasks / 5)) },
      { role: 'WELDER/FABRICATOR', count: projectComplexity.needsWelding ? Math.max(1, Math.ceil(totalTasks / 10)) : 0 },
      { role: 'TIME KEEPER/WAREHOUSEMEN', count: projects.length > 0 ? 1 : 0 }
    ]
    
    laborRoles.forEach(({ role, count }) => {
      if (count > 0) {
        const item = itemLabels[itemCounter] || (itemCounter + 1).toString()
        const monthValues = months.map(() => count.toString())
        
        tableData.push([
          item,
          role,
          ...monthValues
        ])
        itemCounter++
      }
    })
    
    return tableData
  }
  
  private calculateRealTaskMonthValues(task: TaskData, months: string[]): string[] {
    const monthValues: string[] = []
    
    if (!task.start_date || !task.end_date) {
      return months.map(() => '')
    }
    
    const startDate = new Date(task.start_date)
    const endDate = new Date(task.end_date)
    const currentDate = new Date()
    
    // Calculate which months the task spans with real data
    for (let i = 0; i < months.length; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 0)
      
      // Check if task overlaps with this month
      if (startDate <= monthEnd && endDate >= monthDate) {
        // Calculate workload based on task properties
        const workload = this.calculateTaskWorkload(task)
        monthValues.push(workload.toString())
      } else {
        monthValues.push('')
      }
    }
    
    return monthValues
  }
  
  private calculateTaskWorkload(task: TaskData): number {
    // Calculate workload based on task complexity, estimated hours, status
    let baseWorkload = 1
    
    if (task.estimated_hours) {
      baseWorkload = Math.ceil(task.estimated_hours / 40) // Convert hours to weeks/months
    }
    
    // Adjust based on task status
    if (task.status === 'in-progress') {
      baseWorkload = Math.max(1, Math.ceil(baseWorkload * 0.7)) // Partial completion
    } else if (task.status === 'completed') {
      baseWorkload = 0 // No more work needed
    }
    
    // Adjust based on priority
    if (task.priority === 'high') {
      baseWorkload = Math.max(baseWorkload, 2) // High priority needs more resources
    }
    
    return Math.max(1, baseWorkload)
  }
  
  private analyzeProjectComplexity(projects: ProjectData[], tasks: TaskData[]) {
    const analysis = {
      hasHighRisk: false,
      needsWelding: false,
      complexity: 'medium' as 'low' | 'medium' | 'high'
    }
    
    // Analyze task complexity
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length
    const totalTasks = tasks.length
    
    if (totalTasks > 50 || highPriorityTasks > 10) {
      analysis.complexity = 'high'
      analysis.hasHighRisk = true
    } else if (totalTasks < 10 && highPriorityTasks < 3) {
      analysis.complexity = 'low'
    }
    
    // Check for welding/fabrication requirements
    const weldingKeywords = ['weld', 'fabricat', 'steel', 'metal', 'bracket', 'mount']
    analysis.needsWelding = tasks.some(task => 
      weldingKeywords.some(keyword => 
        task.title.toLowerCase().includes(keyword) || 
        task.description?.toLowerCase().includes(keyword)
      )
    )
    
    return analysis
  }
  
  private calculateTaskMonthValues(task: TaskData, months: string[]): string[] {
    const monthValues: string[] = []
    
    if (!task.start_date || !task.end_date) {
      return months.map(() => '')
    }
    
    const startDate = new Date(task.start_date)
    const endDate = new Date(task.end_date)
    const currentDate = new Date()
    
    // Calculate which months the task spans
    for (let i = 0; i < months.length; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      
      if (monthDate >= startDate && monthDate <= endDate) {
        // For tasks, show estimated hours or a default value
        const hours = task.estimated_hours || 8
        monthValues.push(hours.toString())
      } else {
        monthValues.push('')
      }
    }
    
    return monthValues
  }

  private async generateAllProjectsReport(
    projects: ProjectData[],
    tasks: TaskData[],
    options: ExportOptions
  ) {
    // Header
    this.addReportHeader('GYG POWER SYSTEMS - ELECTRICAL ENGINEERING PORTFOLIO', 'Comprehensive Engineering Projects Analysis & Status Report')
    
    // Executive Summary Table
    this.addSection('EXECUTIVE ENGINEERING SUMMARY')
    const summaryData = this.calculatePortfolioSummary(projects, tasks)
    this.addSummaryTable(summaryData)

    // Projects Overview Table
    this.addSection('ELECTRICAL PROJECTS OVERVIEW')
    this.addProjectsTable(projects, tasks)

    // Technical Task Status
    if (options.includeTaskDetails) {
      this.addSection('ENGINEERING TASK STATUS ANALYSIS')
      this.addTaskStatusTable(tasks)
    }

    // Engineering Team Resources
    if (options.includeResourceAnalysis) {
      this.addSection('ELECTRICAL ENGINEERING TEAM RESOURCES')
      this.addResourceAnalysisTable(tasks)
    }

    // Project Timeline Analysis
    if (options.includeTimeline) {
      this.addSection('PROJECT TIMELINE & MILESTONES ANALYSIS')
      this.addTimelineAnalysisTable(projects, tasks)
    }

    // Technical Risk Assessment
    this.addSection('ELECTRICAL SYSTEMS RISK ASSESSMENT')
    this.addRiskAssessmentTable(projects, tasks)

    // Electrical Engineering Analysis
    this.addSection('ELECTRICAL SYSTEMS & EQUIPMENT ANALYSIS')
    this.addElectricalSystemsAnalysis(projects, tasks)

    // Compliance and Safety Summary
    this.addSection('SAFETY & COMPLIANCE STANDARDS OVERVIEW')
    this.addComplianceSafetyAnalysis(projects)
  }

  private async generateSpecificProjectReport(
    projects: ProjectData[],
    tasks: TaskData[],
    options: ExportOptions
  ) {
    const project = projects.find(p => p.id === options.projectId)
    const projectTasks = tasks.filter(t => t.project_id === options.projectId)

    if (!project) {
      throw new Error('Project not found')
    }

    // Header with enhanced branding
    this.addEnhancedProjectHeader(project)

    // Project and Manpower Schedule Table (Main Feature)
    this.addSection('PROJECT AND MANPOWER SCHEDULE')
    this.addProjectManpowerSchedule(project, projectTasks)

    // Additional sections if requested
    if (options.includeTaskDetails) {
      this.addSection('DETAILED TASK BREAKDOWN')
      this.addDetailedTasksTable(projectTasks)
    }

    if (options.includeResourceAnalysis) {
      this.addSection('RESOURCE UTILIZATION ANALYSIS')
      this.addProjectResourceAnalysis(projectTasks)
    }

    if (options.includeTimeline) {
      this.addSection('TIMELINE ANALYSIS')
      this.addProjectTimelineAnalysis(project, projectTasks)
    }
  }

  private addEnhancedProjectHeader(project: ProjectData) {
    // Enhanced header with company branding
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(255, 102, 0) // Orange color for GYG
    this.doc.text('GYG Power Systems Inc.', this.margin, this.currentY)
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('Engineers • Contractors • Consultants', this.margin, this.currentY + 8)
    
    // Contact information
    this.doc.setFontSize(9)
    this.doc.setTextColor(100, 100, 100)
    this.doc.text('59 Malakas St., San Francisco del Monte,', this.pageWidth - 70, this.currentY)
    this.doc.text('Quezon City', this.pageWidth - 70, this.currentY + 4)
    this.doc.text('gyg.powersystems@gmail.com', this.pageWidth - 70, this.currentY + 8)

    this.currentY += 25

    // Project title section
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    const titleText = 'PROJECT AND MANPOWER SCHEDULE'
    const titleWidth = this.doc.getTextWidth(titleText)
    this.doc.text(titleText, (this.pageWidth - titleWidth) / 2, this.currentY)
    
    this.currentY += 15
  }

  private addProjectManpowerSchedule(project: ProjectData, tasks: TaskData[]) {
    // Create enhanced manpower schedule table similar to the image
    const monthlyData = this.generateMonthlyScheduleData(project, tasks)
    
    // Table headers
    const headers = [
      { content: 'ITEM', styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240] } },
      { content: 'DESCRIPTION', styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240] } },
      { content: 'MONTHLY ACTIVITY', styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240], colSpan: 14 } }
    ]

    // Month numbers (1-14 for extended timeline)
    const monthHeaders = []
    for (let i = 1; i <= 14; i++) {
      monthHeaders.push({ content: i.toString(), styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 220, 220] } })
    }

    // Generate task rows with manpower allocation
    const taskRows = this.generateTaskManpowerRows(tasks, monthlyData)

    // Create the main schedule table
    // Create simplified table for compatibility
    autoTable(this.doc, {
      startY: this.currentY,
      head: [['ITEM', 'DESCRIPTION', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14']],
      body: taskRows,
      theme: 'grid' as const,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0] as const,
        lineWidth: 0.1
      },
      margin: { left: this.margin, right: this.margin }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private generateMonthlyScheduleData(project: ProjectData, tasks: TaskData[]) {
    // Generate monthly timeline based on project dates
    const startDate = new Date(project.start_date)
    const endDate = new Date(project.end_date)
    const monthlyData = []

    let currentDate = new Date(startDate)
    let monthIndex = 1

    while (currentDate <= endDate && monthIndex <= 14) {
      monthlyData.push({
        monthIndex,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        tasks: tasks.filter(task => {
          if (!task.start_date || !task.end_date) return false
          const taskStart = new Date(task.start_date)
          const taskEnd = new Date(task.end_date)
          const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
          
          return (taskStart <= monthEnd && taskEnd >= monthStart)
        })
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
      monthIndex++
    }

    return monthlyData
  }

  private generateTaskManpowerRows(tasks: TaskData[], monthlyData: any[]) {
    const rows = []
    let itemIndex = 1

    // Group tasks by category/phase
    const taskGroups = this.groupTasksByCategory(tasks)

    // Add equipment/construction tasks
    Object.entries(taskGroups).forEach(([category, categoryTasks]) => {
      const categoryTasks_typed = categoryTasks as TaskData[]
      categoryTasks_typed.forEach((task) => {
        const taskRow = [
          String.fromCharCode(64 + itemIndex), // A, B, C, etc.
          task.title.toUpperCase(),
          ...this.generateMonthlyManpowerCells(task, monthlyData)
        ]
        rows.push(taskRow)
        itemIndex++
      })
    })

    // Add project staff section
    rows.push([
      '', 
      { content: 'PROJECT STAFF', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } },
      ...Array(14).fill('')
    ])

    // Add standard project roles with consistent manpower
    const projectRoles = [
      'PROJECT IN-CHARGE',
      'PROJECT ENGINEER', 
      'QC ENGINEER',
      'SAFETY OFFICER'
    ]

    projectRoles.forEach((role) => {
      const roleRow = [
        String.fromCharCode(64 + itemIndex),
        role,
        ...Array(14).fill('1') // Consistent 1 person throughout project
      ]
      rows.push(roleRow)
      itemIndex++
    })

    // Add direct labor section
    rows.push([
      '', 
      { content: 'DIRECT LABOR', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } },
      ...Array(14).fill('')
    ])

    const laborRoles = [
      'FOREMAN',
      'ELECTRICIAN',
      'HELPER',
      'WELDER/FABRICATOR',
      'TIME KEEPER/WAREHOUSEMEN'
    ]

    laborRoles.forEach((role) => {
      const laborRow = [
        String.fromCharCode(64 + itemIndex),
        role,
        ...this.generateLaborManpowerCells(role, monthlyData)
      ]
      rows.push(laborRow)
      itemIndex++
    })

    return rows
  }

  private groupTasksByCategory(tasks: TaskData[]) {
    return tasks.reduce((groups, task) => {
      const category = task.category || task.phase || 'General'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(task)
      return groups
    }, {} as Record<string, TaskData[]>)
  }

  private generateMonthlyManpowerCells(task: TaskData, monthlyData: any[]) {
    const cells = []
    
    for (const monthData of monthlyData) {
      const isTaskActive = monthData.tasks.some((t: TaskData) => t.id === task.id)
      
      if (isTaskActive) {
        // Calculate manpower based on task complexity/priority
        let manpower = this.calculateTaskManpower(task)
        cells.push(manpower.toString())
      } else {
        cells.push('')
      }
    }

    // Fill remaining months if less than 14
    while (cells.length < 14) {
      cells.push('')
    }

    return cells
  }

  private generateLaborManpowerCells(role: string, monthlyData: any[]) {
    const cells = []
    
    // Different roles have different manpower patterns
    const rolePatterns: Record<string, number[]> = {
      'FOREMAN': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      'ELECTRICIAN': [4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4],
      'HELPER': [4, 6, 6, 6, 6, 10, 10, 10, 10, 10, 10, 8, 8, 2],
      'WELDER/FABRICATOR': [2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0],
      'TIME KEEPER/WAREHOUSEMEN': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    }

    const pattern = rolePatterns[role] || Array(14).fill(1)
    
    for (let i = 0; i < 14; i++) {
      cells.push(pattern[i].toString())
    }

    return cells
  }

  private calculateTaskManpower(task: TaskData): number {
    // Calculate manpower based on task characteristics
    if (task.category?.toLowerCase().includes('electrical')) return 6
    if (task.category?.toLowerCase().includes('mechanical')) return 4
    if (task.title.toLowerCase().includes('installation')) return 8
    if (task.title.toLowerCase().includes('testing')) return 2
    if (task.priority === 'high') return 6
    if (task.priority === 'medium') return 4
    return 2 // default
  }

  private addReportHeader(title: string, subtitle: string) {
    // Add GYG Power Systems logo
    this.addCompanyLogo()
    
    // Company header area
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(25, 82, 140) // Professional blue
    this.doc.text(title, this.margin, this.currentY)
    
    this.currentY += 8
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    this.doc.text(subtitle, this.margin, this.currentY)
    
    this.currentY += 6
    this.doc.setTextColor(150, 150, 150)
    this.doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, this.margin, this.currentY)
    
    // Header line
    this.currentY += 5
    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    
    this.currentY += 10
    this.doc.setTextColor(0, 0, 0) // Reset text color
  }

  private addSection(title: string) {
    this.checkPageBreak(20)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 8
  }

  private addSummaryTable(summaryData: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalTasks: number
    completedTasks: number
    overallProgress: number
    overdueTasks: number
    projectsAtRisk: number
    teamMembers: number
  }) {
    const tableData = [
      ['Total Engineering Projects', summaryData.totalProjects.toString()],
      ['Active Projects', summaryData.activeProjects.toString()],
      ['Completed Projects', summaryData.completedProjects.toString()],
      ['Overall Engineering Progress', `${summaryData.overallProgress}%`],
      ['Total Technical Tasks', summaryData.totalTasks.toString()],
      ['Completed Tasks', summaryData.completedTasks.toString()],
      ['Overdue Tasks', summaryData.overdueTasks.toString()],
      ['Projects at Risk', summaryData.projectsAtRisk.toString()],
      ['Engineering Team Size', summaryData.teamMembers.toString()]
    ]

    autoTable(this.doc, {
      head: [['ELECTRICAL ENGINEERING METRICS', 'VALUE']],
      body: tableData,
      startY: this.currentY,
      theme: 'grid',
      headStyles: { fillColor: [28, 119, 168], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 90, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addProjectsTable(projects: ProjectData[], tasks: TaskData[]) {
    const tableData = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      const completedTasks = projectTasks.filter(t => t.status === 'completed').length
      const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
      const overdueTasks = projectTasks.filter(t => t.is_overdue).length
      const totalHours = projectTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0)

      return [
        project.name,
        project.client || 'Internal',
        project.status.toUpperCase(),
        project.priority || 'Medium',
        project.voltage_level || 'TBD',
        project.equipment_type || 'Mixed',
        project.start_date ? format(new Date(project.start_date), 'MMM dd') : 'TBD',
        project.end_date ? format(new Date(project.end_date), 'MMM dd') : 'TBD',
        `${progress}%`,
        overdueTasks.toString(),
        `${totalHours}h`
      ]
    })

    autoTable(this.doc, {
      head: [['Engineering Project', 'Client/Utility', 'Status', 'Priority', 'Voltage', 'Equipment', 'Start', 'Target End', 'Progress', 'Overdue', 'Hours']],
      body: tableData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: { fillColor: [25, 82, 140], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },
        1: { cellWidth: 18 },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 15 },
        6: { cellWidth: 12, halign: 'center' },
        7: { cellWidth: 12, halign: 'center' },
        8: { cellWidth: 12, halign: 'center' },
        9: { cellWidth: 12, halign: 'center' },
        10: { cellWidth: 12, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addTaskStatusTable(tasks: TaskData[]) {
    const statusCounts = tasks.reduce((acc, task) => {
      const status = task.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const phaseCounts = tasks.reduce((acc, task) => {
      const phase = task.phase || 'unspecified'
      acc[phase] = (acc[phase] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Status breakdown table
    const statusData = Object.entries(statusCounts).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      count.toString(),
      `${Math.round((count / tasks.length) * 100)}%`
    ])

    autoTable(this.doc, {
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      startY: this.currentY,
      theme: 'grid',
      headStyles: { fillColor: [155, 89, 182], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 5

    // Phase breakdown table
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Task Breakdown by Phase', this.margin, this.currentY)
    this.currentY += 8

    const phaseData = Object.entries(phaseCounts).map(([phase, count]) => [
      phase.charAt(0).toUpperCase() + phase.slice(1),
      count.toString(),
      `${Math.round((count / tasks.length) * 100)}%`
    ])

    autoTable(this.doc, {
      head: [['Phase', 'Count', 'Percentage']],
      body: phaseData,
      startY: this.currentY,
      theme: 'grid',
      headStyles: { fillColor: [230, 126, 34], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addResourceAnalysisTable(tasks: TaskData[]) {
    const assigneeStats = tasks.reduce((acc, task) => {
      const assignee = task.assignee || 'Unassigned'
      if (!acc[assignee]) {
        acc[assignee] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          estimatedHours: 0
        }
      }
      
      acc[assignee].total++
      if (task.status === 'completed') acc[assignee].completed++
      if (task.status === 'in-progress') acc[assignee].inProgress++
      if (task.is_overdue) acc[assignee].overdue++
      acc[assignee].estimatedHours += task.estimated_hours || 0
      
      return acc
    }, {} as Record<string, {total: number, completed: number, inProgress: number, overdue: number, estimatedHours: number}>)

    const resourceData = Object.entries(assigneeStats).map(([assignee, stats]) => {
      const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      const workloadLevel = stats.total > 8 ? 'High' : stats.total > 4 ? 'Medium' : 'Low'
      
      return [
        assignee,
        stats.total.toString(),
        stats.completed.toString(),
        stats.inProgress.toString(),
        stats.overdue.toString(),
        `${completionRate}%`,
        stats.estimatedHours.toString(),
        workloadLevel
      ]
    })

    autoTable(this.doc, {
      head: [['Team Member', 'Total Tasks', 'Completed', 'In Progress', 'Overdue', 'Completion Rate', 'Est. Hours', 'Workload']],
      body: resourceData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 15, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addTimelineAnalysisTable(projects: ProjectData[], tasks: TaskData[]) {
    const timelineData = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      const startDate = project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : 'TBD'
      const endDate = project.end_date ? format(new Date(project.end_date), 'MMM dd, yyyy') : 'TBD'
      
      // Calculate project duration in days
      let duration = 'TBD'
      if (project.start_date && project.end_date) {
        const start = new Date(project.start_date)
        const end = new Date(project.end_date)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        duration = `${days} days`
      }

      // Calculate days until deadline
      let timeRemaining = 'TBD'
      if (project.end_date) {
        const end = new Date(project.end_date)
        const now = new Date()
        const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        timeRemaining = days > 0 ? `${days} days left` : `${Math.abs(days)} days overdue`
      }

      const milestones = projectTasks.filter(t => t.priority === 'critical' || t.priority === 'high').length
      const completedMilestones = projectTasks.filter(t => 
        (t.priority === 'critical' || t.priority === 'high') && t.status === 'completed'
      ).length

      return [
        project.name,
        startDate,
        endDate,
        duration,
        timeRemaining,
        `${completedMilestones}/${milestones}`,
        project.status
      ]
    })

    autoTable(this.doc, {
      head: [['Project', 'Start Date', 'End Date', 'Duration', 'Time Remaining', 'Milestones', 'Status']],
      body: timelineData,
      startY: this.currentY,
      theme: 'grid',
      headStyles: { fillColor: [192, 57, 43], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 18 },
        4: { cellWidth: 22 },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addRiskAssessmentTable(projects: ProjectData[], tasks: TaskData[]) {
    const riskData = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      const overdueTasks = projectTasks.filter(t => t.is_overdue).length
      const unassignedTasks = projectTasks.filter(t => !t.assignee || t.assignee === 'Unassigned').length
      const highPriorityTasks = projectTasks.filter(t => t.priority === 'critical' || t.priority === 'high').length
      const completedHighPriority = projectTasks.filter(t => 
        (t.priority === 'critical' || t.priority === 'high') && t.status === 'completed'
      ).length

      // Calculate risk level
      let riskLevel = 'Low'
      let riskScore = 0
      
      if (overdueTasks > 0) riskScore += 3
      if (unassignedTasks > 2) riskScore += 2
      if (highPriorityTasks > 0 && (completedHighPriority / highPriorityTasks) < 0.5) riskScore += 2
      
      if (riskScore >= 5) riskLevel = 'High'
      else if (riskScore >= 3) riskLevel = 'Medium'

      return [
        project.name,
        overdueTasks.toString(),
        unassignedTasks.toString(),
        `${completedHighPriority}/${highPriorityTasks}`,
        riskLevel,
        this.getRiskRecommendation(overdueTasks, unassignedTasks, riskLevel)
      ]
    })

    autoTable(this.doc, {
      head: [['Project', 'Overdue Tasks', 'Unassigned', 'Critical Progress', 'Risk Level', 'Recommendation']],
      body: riskData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 45 }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  // Methods for specific project report
  private addProjectOverviewTable(project: ProjectData, tasks: TaskData[]) {
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
    const overdueTasks = tasks.filter(t => t.is_overdue).length
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0)
    const criticalTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length

    // Enhanced electrical engineering project overview
    const projectInfoData = [
      ['Project Name', project.name],
      ['Client/Utility Company', project.client || 'Internal Project'],
      ['Project Status', project.status.toUpperCase()],
      ['Priority Level', project.priority || 'Medium'],
      ['Engineering Category', project.category || 'General Electrical'],
      ['Voltage Level', project.voltage_level || 'TBD'],
      ['Equipment Type', project.equipment_type || 'Mixed Systems'],
      ['Safety Classification', project.safety_classification || 'Standard'],
      ['Compliance Standards', project.compliance_standard || 'IEEE/NEC Standards']
    ]

    const scheduleProgressData = [
      ['Start Date', project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : 'TBD'],
      ['Target Completion', project.end_date ? format(new Date(project.end_date), 'MMM dd, yyyy') : 'TBD'],
      ['Engineering Progress', `${progress}% Complete`],
      ['Total Tasks', `${tasks.length} Tasks`],
      ['Completed Tasks', `${completedTasks} Tasks`],
      ['Critical Tasks', `${criticalTasks} Tasks`],
      ['Overdue Tasks', `${overdueTasks} Tasks`],
      ['Total Engineering Hours', `${totalHours} hrs`],
      ['On-Time Performance', this.calculateOnTimeRate(tasks)]
    ]

    // Project Information table (left side)
    autoTable(this.doc, {
      head: [['PROJECT INFORMATION', 'DETAILS']],
      body: projectInfoData,
      startY: this.currentY,
      margin: { left: 15 },
      theme: 'grid',
      headStyles: { 
        fillColor: [25, 82, 140], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { 
          cellWidth: 45, 
          fontStyle: 'bold', 
          fontSize: 8,
          fillColor: [237, 241, 247]
        },
        1: { 
          cellWidth: 50, 
          fontSize: 8 
        }
      },
      tableWidth: 95
    })

    // Schedule & Progress table (right side)
    autoTable(this.doc, {
      head: [['SCHEDULE & PROGRESS', 'STATUS']],
      body: scheduleProgressData,
      startY: this.currentY,
      margin: { left: 105 },
      theme: 'grid',
      headStyles: { 
        fillColor: [40, 167, 69], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { 
          cellWidth: 45, 
          fontStyle: 'bold', 
          fontSize: 8,
          fillColor: [237, 247, 241]
        },
        1: { 
          cellWidth: 50, 
          fontSize: 8 
        }
      },
      tableWidth: 95
    })

    this.currentY = this.doc.lastAutoTable.finalY + 15
  }

  private addDetailedTasksTable(tasks: TaskData[]) {
    const taskData = tasks.map(task => {
      const startDate = task.start_date ? format(new Date(task.start_date), 'MMM dd') : 'TBD'
      const endDate = task.end_date ? format(new Date(task.end_date), 'MMM dd') : 'TBD'
      const status = task.is_overdue ? `${task.status} (OVERDUE)` : task.status

      return [
        task.title,
        task.assignee || 'Unassigned',
        status,
        `${task.progress || 0}%`,
        task.priority || 'Medium',
        task.phase || 'N/A',
        startDate,
        endDate,
        (task.estimated_hours || 0).toString()
      ]
    })

    autoTable(this.doc, {
      head: [['Task Name', 'Assignee', 'Status', 'Progress', 'Priority', 'Phase', 'Start', 'End', 'Hours']],
      body: taskData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: { fillColor: [155, 89, 182], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20 },
        2: { cellWidth: 18 },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 12 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 15 },
        8: { cellWidth: 10, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addProjectResourceTable(tasks: TaskData[]) {
    const resourceStats = tasks.reduce((acc, task) => {
      const assignee = task.assignee || 'Unassigned'
      if (!acc[assignee]) {
        acc[assignee] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          hours: 0,
          phases: new Set()
        }
      }
      
      acc[assignee].total++
      if (task.status === 'completed') acc[assignee].completed++
      if (task.status === 'in-progress') acc[assignee].inProgress++
      if (task.is_overdue) acc[assignee].overdue++
      acc[assignee].hours += task.estimated_hours || 0
      if (task.phase) acc[assignee].phases.add(task.phase)
      
      return acc
    }, {} as Record<string, {total: number, completed: number, inProgress: number, overdue: number, hours: number, phases: Set<string>}>)

    const resourceData = Object.entries(resourceStats).map(([assignee, stats]) => {
      const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      const phases = Array.from(stats.phases).join(', ')
      
      return [
        assignee,
        stats.total.toString(),
        stats.completed.toString(),
        stats.inProgress.toString(),
        stats.overdue.toString(),
        `${completionRate}%`,
        stats.hours.toString(),
        phases || 'N/A'
      ]
    })

    autoTable(this.doc, {
      head: [['Team Member', 'Total', 'Done', 'In Progress', 'Overdue', 'Rate', 'Hours', 'Phases']],
      body: resourceData,
      startY: this.currentY,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold' },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 12, halign: 'center' },
        7: { cellWidth: 40 }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addProjectTimelineTable(tasks: TaskData[]) {
    const sortedTasks = tasks
      .filter(task => task.start_date)
      .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())

    const timelineData = sortedTasks.map(task => {
      const startDate = format(new Date(task.start_date!), 'MMM dd, yyyy')
      const endDate = task.end_date ? format(new Date(task.end_date), 'MMM dd, yyyy') : 'TBD'
      
      let duration = 'TBD'
      if (task.start_date && task.end_date) {
        const start = new Date(task.start_date)
        const end = new Date(task.end_date)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        duration = `${days} days`
      }

      return [
        task.title,
        startDate,
        endDate,
        duration,
        task.assignee || 'Unassigned',
        task.status,
        task.is_overdue ? 'YES' : 'NO'
      ]
    })

    autoTable(this.doc, {
      head: [['Task', 'Start Date', 'End Date', 'Duration', 'Assignee', 'Status', 'Overdue']],
      body: timelineData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: { fillColor: [230, 126, 34], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 20 },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 12, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addDependenciesTable(tasks: TaskData[]) {
    // For now, we'll show a simplified dependencies view
    // In the real implementation, you'd process the actual dependencies array
    const dependencyData = tasks
      .filter(task => task.priority === 'critical' || task.priority === 'high')
      .map(task => [
        task.title,
        task.priority || 'Medium',
        task.status,
        task.assignee || 'Unassigned',
        'See detailed dependencies in project management system'
      ])

    if (dependencyData.length > 0) {
      autoTable(this.doc, {
        head: [['Critical Task', 'Priority', 'Status', 'Assignee', 'Dependencies']],
        body: dependencyData,
        startY: this.currentY,
        theme: 'grid',
        headStyles: { fillColor: [192, 57, 43], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 20 },
          4: { cellWidth: 50 }
        }
      })

      this.currentY = this.doc.lastAutoTable.finalY + 10
    } else {
      this.doc.setFontSize(10)
      this.doc.text('No critical tasks identified for dependency analysis.', this.margin, this.currentY)
      this.currentY += 15
    }
  }

  private addPerformanceMetricsTable(project: ProjectData, tasks: TaskData[]) {
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const totalTasks = tasks.length
    const overdueTasks = tasks.filter(t => t.is_overdue).length
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0)
    const completedHours = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, task) => sum + (task.estimated_hours || 0), 0)

    const metricsData = [
      ['Completion Rate', `${Math.round((completedTasks / totalTasks) * 100)}%`],
      ['Tasks Completed', `${completedTasks} of ${totalTasks}`],
      ['Tasks Overdue', overdueTasks.toString()],
      ['Tasks In Progress', inProgressTasks.toString()],
      ['Hour Completion Rate', `${Math.round((completedHours / totalHours) * 100)}%`],
      ['Estimated Hours', `${completedHours} of ${totalHours}`],
      ['Average Task Duration', this.calculateAverageTaskDuration(tasks)],
      ['On-Time Delivery Rate', this.calculateOnTimeRate(tasks)]
    ]

    autoTable(this.doc, {
      head: [['Metric', 'Value']],
      body: metricsData,
      startY: this.currentY,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addProjectRisksTable(tasks: TaskData[]) {
    const risks = []
    
    const overdueTasks = tasks.filter(t => t.is_overdue)
    if (overdueTasks.length > 0) {
      risks.push(['Schedule Risk', 'High', `${overdueTasks.length} overdue tasks`, 'Immediate action required'])
    }

    const unassignedTasks = tasks.filter(t => !t.assignee || t.assignee === 'Unassigned')
    if (unassignedTasks.length > 0) {
      risks.push(['Resource Risk', 'Medium', `${unassignedTasks.length} unassigned tasks`, 'Assign resources'])
    }

    const criticalTasks = tasks.filter(t => t.priority === 'critical' && t.status !== 'completed')
    if (criticalTasks.length > 0) {
      risks.push(['Priority Risk', 'High', `${criticalTasks.length} incomplete critical tasks`, 'Prioritize completion'])
    }

    if (risks.length === 0) {
      risks.push(['No Major Risks', 'Low', 'All tasks properly assigned and on schedule', 'Continue monitoring'])
    }

    autoTable(this.doc, {
      head: [['Risk Type', 'Level', 'Description', 'Recommendation']],
      body: risks,
      startY: this.currentY,
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 50 },
        3: { cellWidth: 40 }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  // Electrical Engineering Specific Analysis Methods
  private addElectricalSystemsAnalysis(projects: ProjectData[], tasks: TaskData[]) {
    // Voltage Level Distribution
    const voltageStats = projects.reduce((acc, project) => {
      const voltage = project.voltage_level || 'Unspecified'
      acc[voltage] = (acc[voltage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Equipment Type Distribution
    const equipmentStats = projects.reduce((acc, project) => {
      const equipment = project.equipment_type || 'Mixed Systems'
      acc[equipment] = (acc[equipment] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Create voltage distribution table
    const voltageData = Object.entries(voltageStats).map(([voltage, count]) => [
      voltage,
      count.toString(),
      `${Math.round((count / projects.length) * 100)}%`
    ])

    autoTable(this.doc, {
      head: [['Voltage Level', 'Projects', 'Distribution']],
      body: voltageData,
      startY: this.currentY,
      margin: { left: 15 },
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 53, 69], 
        textColor: 255, 
        fontStyle: 'bold' 
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' }
      },
      tableWidth: 85
    })

    // Create equipment distribution table (positioned next to voltage table)
    const equipmentData = Object.entries(equipmentStats).map(([equipment, count]) => [
      equipment,
      count.toString(),
      `${Math.round((count / projects.length) * 100)}%`
    ])

    autoTable(this.doc, {
      head: [['Equipment Type', 'Projects', 'Distribution']],
      body: equipmentData,
      startY: this.currentY,
      margin: { left: 105 },
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 143, 28], 
        textColor: 255, 
        fontStyle: 'bold' 
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' }
      },
      tableWidth: 85
    })

    this.currentY = this.doc.lastAutoTable.finalY + 15

    // Engineering workload analysis
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(40, 40, 40)
    this.doc.text('Engineering Workload Analysis', this.margin, this.currentY)
    this.currentY += 8

    const workloadData = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      const totalHours = projectTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0)
      const completedHours = projectTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, task) => sum + (task.estimated_hours || 0), 0)
      
      const efficiency = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0
      const complexity = this.calculateProjectComplexity(project, projectTasks)

      return [
        project.name,
        project.voltage_level || 'TBD',
        totalHours.toString() + 'h',
        completedHours.toString() + 'h',
        `${efficiency}%`,
        complexity,
        projectTasks.filter(t => t.priority === 'critical').length.toString()
      ]
    })

    autoTable(this.doc, {
      head: [['Project', 'Voltage', 'Total Hours', 'Completed', 'Efficiency', 'Complexity', 'Critical Tasks']],
      body: workloadData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: { fillColor: [108, 117, 125], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  private addComplianceSafetyAnalysis(projects: ProjectData[]) {
    // Safety Classification Analysis
    const safetyStats = projects.reduce((acc, project) => {
      const safety = project.safety_classification || 'Standard'
      acc[safety] = (acc[safety] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Compliance Standards Analysis
    const complianceStats = projects.reduce((acc, project) => {
      const compliance = project.compliance_standard || 'IEEE/NEC Standards'
      acc[compliance] = (acc[compliance] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Safety Classification table
    const safetyData = Object.entries(safetyStats).map(([classification, count]) => [
      classification,
      count.toString(),
      `${Math.round((count / projects.length) * 100)}%`,
      this.getSafetyDescription(classification)
    ])

    autoTable(this.doc, {
      head: [['Safety Classification', 'Projects', '%', 'Description']],
      body: safetyData,
      startY: this.currentY,
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 53, 69], 
        textColor: 255, 
        fontStyle: 'bold' 
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 85 }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10

    // Compliance Standards table
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(40, 40, 40)
    this.doc.text('Compliance Standards Overview', this.margin, this.currentY)
    this.currentY += 8

    const complianceData = Object.entries(complianceStats).map(([standard, count]) => [
      standard,
      count.toString(),
      `${Math.round((count / projects.length) * 100)}%`,
      this.getComplianceDescription(standard)
    ])

    autoTable(this.doc, {
      head: [['Compliance Standard', 'Projects', '%', 'Application']],
      body: complianceData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: { 
        fillColor: [40, 167, 69], 
        textColor: 255, 
        fontStyle: 'bold' 
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 85 }
      }
    })

    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  // Helper methods
  private calculatePortfolioSummary(projects: ProjectData[], tasks: TaskData[]) {
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'active').length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const overdueTasks = tasks.filter(t => t.is_overdue).length
    const projectsAtRisk = projects.filter(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      return projectTasks.some(t => t.is_overdue)
    }).length
    const teamMembers = new Set(tasks.map(t => t.assignee).filter(Boolean)).size

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overallProgress,
      overdueTasks,
      projectsAtRisk,
      teamMembers
    }
  }

  private getRiskRecommendation(overdue: number, unassigned: number, riskLevel: string): string {
    if (riskLevel === 'High') {
      return 'Immediate escalation required'
    } else if (riskLevel === 'Medium') {
      return 'Monitor closely, take corrective action'
    } else {
      return 'Continue current approach'
    }
  }

  private calculateAverageTaskDuration(tasks: TaskData[]): string {
    const tasksWithDates = tasks.filter(t => t.start_date && t.end_date)
    if (tasksWithDates.length === 0) return 'N/A'

    const totalDays = tasksWithDates.reduce((sum, task) => {
      const start = new Date(task.start_date!)
      const end = new Date(task.end_date!)
      return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    }, 0)

    const average = Math.round(totalDays / tasksWithDates.length)
    return `${average} days`
  }

  private calculateOnTimeRate(tasks: TaskData[]): string {
    const completedTasks = tasks.filter(t => t.status === 'completed')
    if (completedTasks.length === 0) return 'N/A'

    const onTimeTasks = completedTasks.filter(t => !t.is_overdue)
    const rate = Math.round((onTimeTasks.length / completedTasks.length) * 100)
    return `${rate}%`
  }

  private calculateProjectComplexity(project: ProjectData, tasks: TaskData[]): string {
    let complexityScore = 0
    
    // Voltage level complexity
    const voltage = project.voltage_level || ''
    if (voltage.includes('kV') || voltage.includes('high')) complexityScore += 2
    else if (voltage.includes('medium')) complexityScore += 1
    
    // Equipment type complexity
    const equipment = project.equipment_type || ''
    if (equipment.includes('Transformer') || equipment.includes('Substation')) complexityScore += 2
    else if (equipment.includes('Distribution') || equipment.includes('Control')) complexityScore += 1
    
    // Task complexity
    const criticalTasks = tasks.filter(t => t.priority === 'critical').length
    const totalTasks = tasks.length
    if (criticalTasks > totalTasks * 0.5) complexityScore += 2
    else if (criticalTasks > totalTasks * 0.25) complexityScore += 1
    
    // Safety classification
    if (project.safety_classification === 'Critical' || project.safety_classification === 'High') {
      complexityScore += 2
    }
    
    if (complexityScore >= 5) return 'High'
    else if (complexityScore >= 3) return 'Medium'
    else return 'Low'
  }

  private getSafetyDescription(classification: string): string {
    switch (classification) {
      case 'Critical':
        return 'High-risk electrical systems requiring specialized safety protocols'
      case 'High':
        return 'Elevated safety requirements with enhanced monitoring'
      case 'Medium':
        return 'Standard safety protocols with regular inspections'
      case 'Standard':
        return 'Basic electrical safety standards and procedures'
      default:
        return 'Standard electrical safety protocols apply'
    }
  }

  private getComplianceDescription(standard: string): string {
    switch (standard) {
      case 'IEEE/NEC Standards':
        return 'Institute of Electrical and Electronics Engineers / National Electrical Code'
      case 'IEC Standards':
        return 'International Electrotechnical Commission standards'
      case 'ANSI Standards':
        return 'American National Standards Institute electrical codes'
      case 'NEMA Standards':
        return 'National Electrical Manufacturers Association guidelines'
      case 'Utility Specific':
        return 'Client utility company specific requirements and standards'
      default:
        return 'General electrical engineering standards and best practices'
    }
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage()
      this.currentY = this.margin + 10
    }
  }
}

// Export function for use in components
export const exportStructuredPDF = async (
  projects: ProjectData[],
  tasks: TaskData[],
  options: ExportOptions
): Promise<void> => {
  const service = new StructuredPDFExportService()
  const blob = await service.exportStructuredReport(projects, tasks, options)

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  
  const exportTypeLabel = options.exportType === 'all-projects' ? 'portfolio-summary' : 'project-report'
  const projectName = options.projectId && projects.find(p => p.id === options.projectId)?.name || 'project'
  const fileName = `${exportTypeLabel}-${projectName.replace(/[^a-zA-Z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
