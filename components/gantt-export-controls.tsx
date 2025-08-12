import React from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Download, 
  FileText, 
  PieChart, 
  Users, 
  Settings 
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface ExportControlsProps {
  onExport: (type: 'executive' | 'detailed' | 'operational', projectId?: string) => void
  projects: Array<{ id: string; name: string }>
  selectedProjectId?: string
  filteredTasksCount: number
  isLoading?: boolean
}

export function GanttExportControls({ 
  onExport, 
  projects, 
  selectedProjectId, 
  filteredTasksCount,
  isLoading = false 
}: ExportControlsProps) {
  const [selectedProject, setSelectedProject] = React.useState<string>(selectedProjectId || '')

  const handleExportDetailed = () => {
    if (!selectedProject) {
      alert('Please select a project for detailed report')
      return
    }
    onExport('detailed', selectedProject)
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center gap-2">
        <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-white">Export Reports</span>
        <Badge variant="outline" className="text-xs">
          {filteredTasksCount} tasks
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
        {/* Executive Summary Export */}
        <Button
          onClick={() => onExport('executive')}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <PieChart className="h-4 w-4" />
          Executive Summary
        </Button>

        {/* Operational Report Export */}
        <Button
          onClick={() => onExport('operational')}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Operational Report
        </Button>

        {/* Detailed Project Report */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Detailed Report
              <Settings className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                Select Project:
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Choose project..." />
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleExportDetailed}
              disabled={!selectedProject || isLoading}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate Detailed Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Export type descriptions for user guidance
export const EXPORT_TYPE_DESCRIPTIONS = {
  executive: {
    title: "Executive Summary",
    description: "High-level overview with key metrics, risks, and strategic insights",
    audience: "C-level executives, stakeholders, clients",
    pageCount: "1-2 pages",
    includes: [
      "Project portfolio overview",
      "Critical issues and risks",
      "Budget and timeline summary",
      "Key performance indicators",
      "Strategic recommendations"
    ]
  },
  operational: {
    title: "Operational Dashboard",
    description: "Day-to-day operations focus with team performance and immediate actions",
    audience: "Operations managers, team leads, supervisors",
    pageCount: "3-5 pages", 
    includes: [
      "Team performance metrics",
      "Resource utilization analysis",
      "Immediate action items",
      "Upcoming priorities",
      "Workload distribution"
    ]
  },
  detailed: {
    title: "Detailed Project Report",
    description: "Comprehensive project analysis with full task breakdown and timeline",
    audience: "Project managers, technical teams, department heads",
    pageCount: "5-10 pages per project",
    includes: [
      "Complete Gantt chart visualization",
      "Task breakdown by phase/status",
      "Resource allocation analysis",
      "Dependency mapping",
      "Risk assessment and mitigation",
      "Budget tracking and variance"
    ]
  }
} as const
