// Optimized SELECT statements to reduce database load
// Use specific columns instead of SELECT * to minimize data transfer

export const OPTIMIZED_SELECTS = {
  // Projects - core fields only
  projects: `
    id, name, status, priority, location, client,
    start_date, end_date, created_at, updated_at,
    description, team_size
  `.replace(/\s+/g, ' ').trim(),

  // Projects with counts (for dashboard)
  projectsWithCounts: `
    id, name, status, priority, location, client,
    start_date, end_date, created_at, updated_at,
    description, team_size,
    tasks:tasks(count),
    reports:reports(count),
    photos:photos(count)
  `.replace(/\s+/g, ' ').trim(),

  // Tasks - essential fields only
  tasks: `
    id, title, description, status, priority, 
    start_date, end_date, due_date, progress,
    project_id, assigned_to, created_at, updated_at,
    category, phase, estimated_hours
  `.replace(/\s+/g, ' ').trim(),

  // Tasks with relations (for gantt)
  tasksWithRelations: `
    id, title, description, status, priority,
    start_date, end_date, due_date, progress,
    project_id, assigned_to, created_at, updated_at,
    category, phase, estimated_hours,
    project:projects(id, name, status),
    assignee:personnel(id, name, email, position)
  `.replace(/\s+/g, ' ').trim(),

  // Personnel - profile fields only
  personnel: `
    id, name, email, position, phone, avatar_url,
    created_at, updated_at, active
  `.replace(/\s+/g, ' ').trim(),

  // Personnel with stats (for team page)
  personnelWithStats: `
    id, name, email, position, phone, avatar_url,
    created_at, updated_at, active,
    tasks:tasks(count),
    projects:project_personnel(count)
  `.replace(/\s+/g, ' ').trim(),

  // Reports - file info only
  reports: `
    id, file_name, file_path, file_type, file_size,
    status, category, description, title,
    project_id, uploaded_by, uploaded_at,
    assigned_reviewer, reviewer_notes
  `.replace(/\s+/g, ' ').trim(),

  // Reports with relations (for reports page)
  reportsWithRelations: `
    id, file_name, file_path, file_type, file_size,
    status, category, description, title,
    project_id, uploaded_by, uploaded_at,
    assigned_reviewer, reviewer_notes,
    project:projects(id, name),
    uploader:personnel(id, name, position)
  `.replace(/\s+/g, ' ').trim(),

  // Events - calendar fields only
  events: `
    id, title, description, date, time, type,
    project_id, created_at, created_by
  `.replace(/\s+/g, ' ').trim(),

  // Events with relations
  eventsWithRelations: `
    id, title, description, date, time, type,
    project_id, created_at, created_by,
    project:projects(id, name),
    creator:personnel(id, name)
  `.replace(/\s+/g, ' ').trim(),

  // Photos - minimal fields
  photos: `
    id, description, storage_path, file_size,
    upload_date, uploaded_by, project_id,
    created_at
  `.replace(/\s+/g, ' ').trim(),

  // Photos with relations
  photosWithRelations: `
    id, description, storage_path, file_size,
    upload_date, uploaded_by, project_id,
    created_at,
    project:projects(id, name),
    uploader:personnel(id, name)
  `.replace(/\s+/g, ' ').trim(),

  // Dashboard summary data
  dashboardSummary: `
    id, name, status, start_date, end_date,
    tasks:tasks(count),
    reports:reports(count)
  `.replace(/\s+/g, ' ').trim(),

  // User profile minimal
  userProfile: `
    id, name, email, position, avatar_url, active
  `.replace(/\s+/g, ' ').trim()
} as const

// Helper function to get optimized select for specific use case
export function getOptimizedSelect(
  table: keyof typeof OPTIMIZED_SELECTS,
  withRelations: boolean = false
): string {
  const baseKey = table as string
  const relationKey = `${baseKey}WithRelations` as keyof typeof OPTIMIZED_SELECTS
  
  if (withRelations && relationKey in OPTIMIZED_SELECTS) {
    return OPTIMIZED_SELECTS[relationKey]
  }
  
  return OPTIMIZED_SELECTS[table]
}

// Common query filters to reduce data transfer
export const COMMON_FILTERS = {
  // Only active records
  activeOnly: { active: true },
  
  // Recent items (last 30 days)
  recent: `created_at.gte.${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`,
  
  // Current projects (not completed/cancelled)
  currentProjects: `status.in.(active,planning,in_progress)`,
  
  // Pending reports
  pendingReports: `status.eq.pending`,
  
  // Overdue tasks
  overdueTasks: `due_date.lt.${new Date().toISOString()},status.neq.completed`
} as const

// Query limits for performance
export const QUERY_LIMITS = {
  dashboard: 10,
  recent: 20,
  pagination: 50,
  search: 100
} as const
