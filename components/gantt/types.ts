export interface EnhancedTask {
  // Core task properties from database
  id: string
  title: string
  description: string | null
  project_id: string | null
  start_date: string | null
  end_date: string | null
  status: string | null
  priority: string | null
  assignee: string | null
  assigned_to: string | null
  category: string | null
  created_at: string | null
  completed_at: string | null
  dependencies: string[] | null
  due_date: string | null
  duration: number | null
  estimated_hours: number | null
  gantt_position: number | null
  name: string | null
  phase: string | null
  progress: number | null
  updated_at: string | null
  assignee_headcounts: Record<string, number> | null
  task_key: string | null
  // Enhanced properties
  project_name?: string
  project_client?: string | null
  is_overdue?: boolean
  days_until_deadline?: number | null
  dependencyTasks?: EnhancedTask[]
}

export interface TimelineMonth {
  label: string
  date: Date
  endDate: Date
  quarter: number
  year: number
  isQuarter: boolean
}

export interface GanttChartProps {
  readonly selectedProjectId?: string | null
}

export interface TaskPosition {
  left: string
  width: string
  isVisible: boolean
  actualStart: Date | null
  actualEnd: Date | null
}

export interface GanttStats {
  total: number
  completed: number
  inProgress: number
  delayed: number
  avgProgress: number
}

export interface OverallStats {
  total: number
  completed: number
  inProgress: number
  delayed: number
}

export type ViewMode = "daily" | "monthly" | "yearly" | "full"
