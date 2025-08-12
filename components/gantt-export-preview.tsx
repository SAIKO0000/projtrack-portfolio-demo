import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  FileText, 
  PieChart, 
  Users, 
  Eye, 
  Download,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { EXPORT_TYPE_DESCRIPTIONS } from './gantt-export-controls'

interface ExportPreviewProps {
  onExport: (type: 'executive' | 'detailed' | 'operational', projectId?: string) => void
  projects: Array<{ id: string; name: string }>
  tasks: Array<{ 
    status: string
    is_overdue?: boolean
    end_date?: string
    assignee?: string
    project_name?: string
    title: string
  }>
  isLoading?: boolean
}

export function GanttExportPreview({ onExport, projects, tasks, isLoading }: ExportPreviewProps) {
  const [selectedExportType, setSelectedExportType] = useState<'executive' | 'detailed' | 'operational' | null>(null)

  // Calculate key metrics for preview
  const totalProjects = projects.length
  const activeProjects = projects.length // Simplified - would check actual status
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const overallProgress = Math.round((completedTasks / totalTasks) * 100)
  const overdueTasks = tasks.filter(t => t.is_overdue && t.status !== 'completed')
  const upcomingDeadlines = tasks.filter(t => {
    if (!t.end_date) return false
    const endDate = new Date(t.end_date)
    const daysUntil = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntil > 0 && daysUntil <= 7
  })

  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))]

  const renderExecutivePreview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Total Projects</p>
              <p className="text-2xl font-bold">{totalProjects}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Overall Progress</p>
              <p className="text-2xl font-bold">{overallProgress}%</p>
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="p-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          Critical Insights
        </h4>
        <div className="space-y-2 text-sm">
          {overdueTasks.length > 0 && (
            <div className="flex items-center text-red-600">
              <span>⚠ {overdueTasks.length} overdue tasks requiring immediate attention</span>
            </div>
          )}
          {upcomingDeadlines.length > 0 && (
            <div className="flex items-center text-yellow-600">
              <span>📅 {upcomingDeadlines.length} tasks due this week</span>
            </div>
          )}
          {overdueTasks.length === 0 && upcomingDeadlines.length === 0 && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>All projects on track</span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <Badge variant="outline">Portfolio Overview</Badge>
        <Badge variant="outline">Risk Assessment</Badge>
        <Badge variant="outline">Strategic Timeline</Badge>
      </div>
    </div>
  )

  const renderOperationalPreview = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          Immediate Actions Required
        </h4>
        <div className="space-y-1 text-sm">
          {overdueTasks.slice(0, 3).map((task, index) => (
            <div key={index} className="text-red-600">
              • {task.title} ({task.project_name})
            </div>
          ))}
          {overdueTasks.length === 0 && (
            <div className="text-green-600">✓ No urgent actions required</div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <Users className="h-4 w-4 text-blue-500 mr-2" />
          Team Performance
        </h4>
        <div className="space-y-1 text-sm">
          <div>Active team members: {assignees.length}</div>
          <div>Average completion rate: {overallProgress}%</div>
          <div>Tasks in progress: {tasks.filter(t => t.status === 'in-progress').length}</div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <Badge variant="outline">Resource Utilization</Badge>
        <Badge variant="outline">Upcoming Priorities</Badge>
        <Badge variant="outline">Capacity Planning</Badge>
      </div>
    </div>
  )

  const renderDetailedPreview = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <h4 className="font-semibold mb-2">Project Analysis Depth</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total tasks to analyze:</span>
            <span className="font-medium">{totalTasks}</span>
          </div>
          <div className="flex justify-between">
            <span>Completed tasks:</span>
            <span className="font-medium">{completedTasks}</span>
          </div>
          <div className="flex justify-between">
            <span>Team members involved:</span>
            <span className="font-medium">{assignees.length}</span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-2">Report Sections</h4>
        <div className="space-y-1 text-xs">
          <div>📊 Complete Gantt visualization</div>
          <div>📋 Task breakdown by status/phase</div>
          <div>👥 Resource allocation analysis</div>
          <div>🔗 Dependency mapping</div>
          <div>⚠ Risk assessment & recommendations</div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Badge variant="outline">5-10 pages per project</Badge>
        <Badge variant="outline">Technical depth included</Badge>
      </div>
    </div>
  )

  const exportTypeIcons = {
    executive: PieChart,
    operational: Users,
    detailed: FileText
  }

  const exportTypeColors = {
    executive: "text-purple-600",
    operational: "text-blue-600", 
    detailed: "text-green-600"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(EXPORT_TYPE_DESCRIPTIONS).map(([type, description]) => {
        const IconComponent = exportTypeIcons[type as keyof typeof exportTypeIcons]
        const colorClass = exportTypeColors[type as keyof typeof exportTypeColors]
        
        return (
          <Card key={type} className="relative group hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <IconComponent className={`h-5 w-5 ${colorClass}`} />
                <span>{description.title}</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Target audience:</span>
                <Badge variant="outline" className="text-xs">
                  {description.audience.split(',')[0]}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Length:</span>
                <Badge variant="secondary" className="text-xs">
                  {description.pageCount}
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Components:</h4>
                <div className="space-y-1">
                  {description.includes.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                      • {item}
                    </div>
                  ))}
                  {description.includes.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{description.includes.length - 3} more...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedExportType(type as 'executive' | 'detailed' | 'operational')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <IconComponent className={`h-5 w-5 ${colorClass}`} />
                        <span>{description.title} Preview</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      {selectedExportType === 'executive' && renderExecutivePreview()}
                      {selectedExportType === 'operational' && renderOperationalPreview()}
                      {selectedExportType === 'detailed' && renderDetailedPreview()}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => onExport(type as 'executive' | 'detailed' | 'operational')}
                  disabled={isLoading}
                >
                  <Download className="h-3 w-3 mr-1" />
                  {isLoading ? 'Generating...' : 'Export'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
