import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

// Type declarations for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
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
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    this.currentY = 20

    if (options.exportType === 'all-projects') {
      await this.generateAllProjectsReport(projects, tasks, options)
    } else if (options.exportType === 'specific-project' && options.projectId) {
      await this.generateSpecificProjectReport(projects, tasks, options)
    }

    return this.doc.output('blob')
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

    // Header
    this.addReportHeader(`GYG POWER SYSTEMS - PROJECT: ${project.name}`, `Detailed Engineering Analysis - ${project.client || 'Internal Project'}`)

    // Project Overview
    this.addSection('ELECTRICAL PROJECT OVERVIEW')
    this.addProjectOverviewTable(project, projectTasks)

    // Technical Task Breakdown
    if (options.includeTaskDetails) {
      this.addSection('ENGINEERING TASK BREAKDOWN')
      this.addDetailedTasksTable(projectTasks)
    }

    // Engineering Team Allocation
    if (options.includeResourceAnalysis) {
      this.addSection('ELECTRICAL ENGINEERING TEAM ALLOCATION')
      this.addProjectResourceTable(projectTasks)
    }

    // Project Timeline Details
    if (options.includeTimeline) {
      this.addSection('PROJECT TIMELINE & MILESTONES')
      this.addProjectTimelineTable(projectTasks)
    }

    // Technical Risk Analysis
    this.addSection('ELECTRICAL SYSTEMS RISK ANALYSIS')
    this.addProjectRisksTable(projectTasks)
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
