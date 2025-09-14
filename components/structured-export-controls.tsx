
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  FileSpreadsheet, 
  Settings,
  CheckCircle,
  BarChart3,
  Users,
  Calendar,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface StructuredExportControlsProps {
  onExport: (options: ExportOptions) => void
  projects: Array<{ id: string; name: string; client?: string; status: string }>
  totalTasks: number
  isLoading?: boolean
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

export function StructuredExportControls({ 
  onExport, 
  projects, 
  totalTasks,
  isLoading = false 
}: StructuredExportControlsProps) {
  const [exportType, setExportType] = useState<'all-projects' | 'specific-project'>('all-projects')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [includeTaskDetails, setIncludeTaskDetails] = useState(true)
  const [includeResourceAnalysis, setIncludeResourceAnalysis] = useState(true)
  const [includeTimeline, setIncludeTimeline] = useState(true)
  const [includeTechnicalSpecs, setIncludeTechnicalSpecs] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleExport = () => {
    const options: ExportOptions = {
      exportType,
      projectId: exportType === 'specific-project' ? selectedProject : undefined,
      includeTaskDetails,
      includeResourceAnalysis,
      includeTimeline,
      includeTechnicalSpecs
    }

    if (exportType === 'specific-project' && !selectedProject) {
      alert('Please select a project for specific project export')
      return
    }

    onExport(options)
    setIsDialogOpen(false)
  }

  const getExportDescription = () => {
    if (exportType === 'all-projects') {
      return {
        title: 'Engineering Portfolio Report',
        description: 'Comprehensive overview of all engineering projects with structured data analysis',
        scope: `${projects.length} engineering projects, ${totalTasks} total tasks`,
        icon: BarChart3,
        color: 'text-blue-600'
      }
    } else {
      const project = projects.find(p => p.id === selectedProject)
      return {
        title: 'Engineering Project Report',
        description: project ? `Detailed technical analysis of ${project.name}` : 'Select a project for detailed engineering analysis',
        scope: project ? `Engineering project: ${project.name} (${project.client || 'Internal project'})` : 'No project selected',
        icon: FileSpreadsheet,
        color: 'text-green-600'
      }
    }
  }

  const getEstimatedPages = () => {
    if (exportType === 'all-projects') {
      let pages = 3 // Base pages (summary, projects overview, risks)
      if (includeTaskDetails) pages += 2
      if (includeResourceAnalysis) pages += 1
      if (includeTimeline) pages += 1
      if (includeTechnicalSpecs) pages += 1
      return pages
    } else {
      let pages = 2 // Base pages (overview, performance)
      if (includeTaskDetails) pages += 2
      if (includeResourceAnalysis) pages += 1
      if (includeTimeline) pages += 1
      return pages
    }
  }

  const exportInfo = getExportDescription()
  const IconComponent = exportInfo.icon

  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5 text-blue-600" />
          Engineering Report Export
          <Badge variant="secondary" className="ml-auto">
            Excel-like Format
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-2 h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate structured engineering reports with comprehensive project data and technical analysis
        </p>
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>⚠️ This feature is currently under development and may not be fully functional</span>
        </div>
      </CardHeader>

      {!isCollapsed && (
      <CardContent className="space-y-4">
        {/* Export Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Export Scope:</label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={exportType === 'all-projects' ? 'default' : 'outline'}
              onClick={() => setExportType('all-projects')}
              className="h-auto p-3 flex flex-col items-center space-y-1"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">All Engineering Projects</span>
              <span className="text-xs text-gray-500">{projects.length} projects</span>
            </Button>
            <Button
              variant={exportType === 'specific-project' ? 'default' : 'outline'}
              onClick={() => setExportType('specific-project')}
              className="h-auto p-3 flex flex-col items-center space-y-1"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-xs">Single Engineering Project</span>
              <span className="text-xs text-gray-500">Detailed analysis</span>
            </Button>
          </div>
        </div>

        {/* Project Selection (if specific project) */}
        {exportType === 'specific-project' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project:</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{project.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {project.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Export Preview */}
        <Card className="bg-white dark:bg-gray-800 border">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <IconComponent className={`h-6 w-6 ${exportInfo.color} mt-1`} />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{exportInfo.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {exportInfo.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>📊 {exportInfo.scope}</span>
                  <span>📄 ~{getEstimatedPages()} pages</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Configuration */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Include Sections:</label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Task Details & Breakdown</span>
              </div>
              <Switch
                checked={includeTaskDetails}
                onCheckedChange={setIncludeTaskDetails}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Resource Analysis</span>
              </div>
              <Switch
                checked={includeResourceAnalysis}
                onCheckedChange={setIncludeResourceAnalysis}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Timeline Analysis</span>
              </div>
              <Switch
                checked={includeTimeline}
                onCheckedChange={setIncludeTimeline}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Technical Specifications</span>
              </div>
              <Switch
                checked={includeTechnicalSpecs}
                onCheckedChange={setIncludeTechnicalSpecs}
              />
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex gap-2 pt-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Preview Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Export Configuration Preview</DialogTitle>
                <DialogDescription>
                  Review your export settings before generating the report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Report Type:</h4>
                  <p className="text-sm text-gray-600">{exportInfo.title}</p>
                  <p className="text-xs text-gray-500">{exportInfo.scope}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Included Sections:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Executive Summary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Project Overview</span>
                    </div>
                    {includeTaskDetails && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Task Details & Breakdown</span>
                      </div>
                    )}
                    {includeResourceAnalysis && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Resource Analysis</span>
                      </div>
                    )}
                    {includeTimeline && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Timeline Analysis</span>
                      </div>
                    )}
                    {includeTechnicalSpecs && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Technical Specifications</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Risk Assessment</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium text-sm">Estimated Output</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    ~{getEstimatedPages()} pages with structured tables and charts
                  </p>
                </div>

                <Button 
                  onClick={handleExport} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isLoading ? 'Generating PDF...' : 'Generate PDF Report'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={handleExport} 
            disabled={isLoading || (exportType === 'specific-project' && !selectedProject)}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? 'Generating...' : 'Export PDF'}
          </Button>
        </div>

        {/* Quick Info */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="font-medium text-sm">Professional Excel-like Format</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Organized tables, charts, and metrics ready for analysis and presentation
          </p>
        </div>
      </CardContent>
      )}
    </Card>
  )
}
