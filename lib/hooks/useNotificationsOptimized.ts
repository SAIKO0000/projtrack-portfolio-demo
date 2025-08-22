import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { supabase, queryKeys } from '@/lib/supabase-query'

// Optimized Notifications Hook - Replaces multiple useEffect hooks with single cached query
export function useNotificationsQuery() {
  const queryClient = useQueryClient()

  // Single aggregated query that replaces multiple separate fetches
  const query = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: async () => {
      try {
        // Fetch all notification data in parallel using Promise.all
        const [
          photosResult, 
          reportsResult, 
          tasksResult, 
          eventsResult, 
          projectsResult,
          personnelResult,
          recentUpdatesResult
        ] = await Promise.all([
          // Recent photos - handle case where project relation might not exist
          supabase
            .from('photos')
            .select(`
              id, description, storage_path, upload_date, created_at, uploaded_by, project_id,
              project:projects(id, name)
            `)
            .order('upload_date', { ascending: false })
            .limit(20)
            .then(async (result) => {
              if (result.error && result.error.code === 'PGRST116') {
                // Handle missing foreign key relation gracefully
                const photosResult = await supabase
                  .from('photos')
                  .select('id, description, storage_path, upload_date, created_at, uploaded_by, project_id')
                  .order('upload_date', { ascending: false })
                  .limit(20)
                
                // If we have photos but no project relation, fetch projects separately
                if (photosResult.data && photosResult.data.length > 0) {
                  const projectIds = [...new Set(photosResult.data.map(p => p.project_id).filter(Boolean))]
                  if (projectIds.length > 0) {
                    const projectsResult = await supabase
                      .from('projects')
                      .select('id, name')
                      .in('id', projectIds)
                    
                    if (projectsResult.data) {
                      // Map projects back to photos
                      const projectsMap = Object.fromEntries(projectsResult.data.map(p => [p.id, p]))
                      photosResult.data = photosResult.data.map(photo => ({
                        ...photo,
                        project: photo.project_id ? projectsMap[photo.project_id] : null
                      }))
                    }
                  }
                }
                return photosResult
              }
              return result
            }),

          // Recent reports
          supabase
            .from('reports')
            .select(`
              id, file_name, file_path, uploaded_at, uploaded_by, description, project_id,
              project:projects(id, name)
            `)
            .order('uploaded_at', { ascending: false })
            .limit(20)
            .then(async (result) => {
              if (result.error && result.error.code === 'PGRST116') {
                const reportsResult = await supabase
                  .from('reports')
                  .select('id, file_name, file_path, uploaded_at, uploaded_by, description, project_id')
                  .order('uploaded_at', { ascending: false })
                  .limit(20)
                
                // Fetch projects separately if needed
                if (reportsResult.data && reportsResult.data.length > 0) {
                  const projectIds = [...new Set(reportsResult.data.map(r => r.project_id).filter(Boolean))]
                  if (projectIds.length > 0) {
                    const projectsResult = await supabase
                      .from('projects')
                      .select('id, name')
                      .in('id', projectIds)
                    
                    if (projectsResult.data) {
                      const projectsMap = Object.fromEntries(projectsResult.data.map(p => [p.id, p]))
                      reportsResult.data = reportsResult.data.map(report => ({
                        ...report,
                        project: report.project_id ? projectsMap[report.project_id] : null
                      }))
                    }
                  }
                }
                return reportsResult
              }
              return result
            }),

          // Recent tasks
          supabase
            .from('tasks')
            .select(`
              id, name, status, priority, due_date, created_at, updated_at, project_id, assigned_to,
              project:projects(id, name),
              assignee:personnel(name)
            `)
            .order('updated_at', { ascending: false })
            .limit(20)
            .then(async (result) => {
              if (result.error && result.error.code === 'PGRST116') {
                const tasksResult = await supabase
                  .from('tasks')
                  .select('id, name, status, priority, due_date, created_at, updated_at, project_id, assigned_to')
                  .order('updated_at', { ascending: false })
                  .limit(20)
                
                // Fetch related data separately
                if (tasksResult.data && tasksResult.data.length > 0) {
                  const [projectIds, personnelIds] = [
                    [...new Set(tasksResult.data.map(t => t.project_id).filter(Boolean))],
                    [...new Set(tasksResult.data.map(t => t.assigned_to).filter(Boolean))]
                  ]
                  
                  const [projectsResult, personnelResult] = await Promise.all([
                    projectIds.length > 0 ? supabase.from('projects').select('id, name').in('id', projectIds) : { data: [] },
                    personnelIds.length > 0 ? supabase.from('personnel').select('id, name').in('id', personnelIds) : { data: [] }
                  ])
                  
                  const projectsMap = Object.fromEntries((projectsResult.data || []).map(p => [p.id, p]))
                  const personnelMap = Object.fromEntries((personnelResult.data || []).map(p => [p.id, p]))
                  
                  tasksResult.data = tasksResult.data.map(task => ({
                    ...task,
                    project: task.project_id ? projectsMap[task.project_id] : null,
                    assignee: task.assigned_to ? personnelMap[task.assigned_to] : null
                  }))
                }
                return tasksResult
              }
              return result
            }),

          // Recent events
          supabase
            .from('events')
            .select(`
              id, title, date, time, type, created_at, project_id,
              project:projects(id, name)
            `)
            .order('created_at', { ascending: false })
            .limit(20)
            .then(async (result) => {
              if (result.error && result.error.code === 'PGRST116') {
                const eventsResult = await supabase
                  .from('events')
                  .select('id, title, date, time, type, created_at, project_id')
                  .order('created_at', { ascending: false })
                  .limit(20)
                
                // Fetch projects separately if needed
                if (eventsResult.data && eventsResult.data.length > 0) {
                  const projectIds = [...new Set(eventsResult.data.map(e => e.project_id).filter(Boolean))]
                  if (projectIds.length > 0) {
                    const projectsResult = await supabase
                      .from('projects')
                      .select('id, name')
                      .in('id', projectIds)
                    
                    if (projectsResult.data) {
                      const projectsMap = Object.fromEntries(projectsResult.data.map(p => [p.id, p]))
                      eventsResult.data = eventsResult.data.map(event => ({
                        ...event,
                        project: event.project_id ? projectsMap[event.project_id] : null
                      }))
                    }
                  }
                }
                return eventsResult
              }
              return result
            }),

          // Recent project updates 
          supabase
            .from('projects')
            .select('id, name, status, created_at, updated_at')
            .order('updated_at', { ascending: false })
            .limit(15),

          // Personnel activities
          supabase
            .from('personnel')
            .select('id, name, position, created_at, updated_at')
            .order('updated_at', { ascending: false })
            .limit(10),

          // Enhanced activity tracking - report status changes
          supabase
            .from('reports')
            .select(`
              id, file_name, status, uploaded_at, updated_at, 
              reviewer_notes, project_id, uploaded_by,
              project:projects(id, name),
              uploader:personnel!reports_uploaded_by_fkey(name)
            `)
            .not('status', 'eq', 'pending')
            .order('updated_at', { ascending: false })
            .limit(15)
            .then(async (result) => {
              if (result.error && result.error.code === 'PGRST116') {
                const reportsResult = await supabase
                  .from('reports')
                  .select('id, file_name, status, uploaded_at, updated_at, reviewer_notes, project_id, uploaded_by')
                  .not('status', 'eq', 'pending')
                  .order('updated_at', { ascending: false })
                  .limit(15)
                
                // Fetch related data separately
                if (reportsResult.data && reportsResult.data.length > 0) {
                  const [projectIds, uploaderIds] = [
                    [...new Set(reportsResult.data.map(r => r.project_id).filter(Boolean))],
                    [...new Set(reportsResult.data.map(r => r.uploaded_by).filter(Boolean))]
                  ]
                  
                  const [projectsResult, uploadersResult] = await Promise.all([
                    projectIds.length > 0 ? supabase.from('projects').select('id, name').in('id', projectIds) : { data: [] },
                    uploaderIds.length > 0 ? supabase.from('personnel').select('id, name').in('id', uploaderIds) : { data: [] }
                  ])
                  
                  const projectsMap = Object.fromEntries((projectsResult.data || []).map(p => [p.id, p]))
                  const uploadersMap = Object.fromEntries((uploadersResult.data || []).map(u => [u.id, u]))
                  
                  reportsResult.data = reportsResult.data.map(report => ({
                    ...report,
                    project: report.project_id ? projectsMap[report.project_id] : null,
                    uploader: report.uploaded_by ? uploadersMap[report.uploaded_by] : null
                  }))
                }
                return reportsResult
              }
              return result
            })
        ])

        // Check for errors
        if (photosResult.error) {
          console.warn('Photos query error:', photosResult.error)
        }
        if (reportsResult.error) {
          console.warn('Reports query error:', reportsResult.error)
        }
        if (tasksResult.error) {
          console.warn('Tasks query error:', tasksResult.error)
        }
        if (eventsResult.error) {
          console.warn('Events query error:', eventsResult.error)
        }
        if (projectsResult.error) {
          console.warn('Projects query error:', projectsResult.error)
        }
        if (personnelResult.error) {
          console.warn('Personnel query error:', personnelResult.error)
        }
        if (recentUpdatesResult.error) {
          console.warn('Recent updates query error:', recentUpdatesResult.error)
        }

        return {
          photos: photosResult.data || [],
          reports: reportsResult.data || [],
          tasks: tasksResult.data || [],
          events: eventsResult.data || [],
          projects: projectsResult.data || [],
          personnel: personnelResult.data || [],
          recentUpdates: recentUpdatesResult.data || []
        }
      } catch (error) {
        console.error('Error fetching notifications data:', error)
        // Return empty data instead of throwing to prevent component crashes
        return {
          photos: [],
          reports: [],
          tasks: [],
          events: [],
          projects: [],
          personnel: [],
          recentUpdates: []
        }
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - notifications should be relatively fresh
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  })

  // Set up comprehensive realtime subscriptions for all notification sources
  useEffect(() => {
    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos'
        },
        (payload) => {
          console.log('New photo uploaded:', payload)
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
          queryClient.invalidateQueries({ queryKey: queryKeys.photos() })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          console.log('New report uploaded:', payload)
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
          queryClient.invalidateQueries({ queryKey: queryKeys.reports() })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task activity:', payload)
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('New event created:', payload)
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
          queryClient.invalidateQueries({ queryKey: queryKeys.events() })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Project activity:', payload)
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
          queryClient.invalidateQueries({ queryKey: queryKeys.projects() })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          console.log('Report status change:', payload)
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
          queryClient.invalidateQueries({ queryKey: queryKeys.reports() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // Memoized notification processing - prevents unnecessary re-renders
  const processedNotifications = useMemo(() => {
    if (!query.data) return []

    const { photos, reports, tasks, events, projects, personnel, recentUpdates } = query.data
    const notifications: Array<{
      id: string
      type: 'photo' | 'report' | 'task' | 'event' | 'project' | 'personnel' | 'report_update'
      title: string
      project: string
      projectId: string
      timestamp: string
      description?: string
      status?: string
      priority?: string
    }> = []

    // Process photos
    photos.forEach(photo => {
      const photoWithProject = photo as typeof photo & { project?: { id: string; name: string } }
      const projectName = photoWithProject.project?.name || 'Unknown Project'
      const projectId = photoWithProject.project?.id || photo.project_id || 'unknown'
      
      // Better photo title handling
      const photoTitle = photo.description && photo.description.trim() && photo.description !== 'null' 
        ? photo.description 
        : `Photo from ${new Date(photo.upload_date || photo.created_at).toLocaleDateString()}`
      
      notifications.push({
        id: `photo_${photo.id}`,
        type: 'photo',
        title: photoTitle,
        project: projectName,
        projectId: projectId,
        timestamp: photo.upload_date || photo.created_at || new Date().toISOString(),
        description: `Uploaded to ${projectName}`
      })
    })

    // Process reports
    reports.forEach(report => {
      const reportWithProject = report as typeof report & { project?: { id: string; name: string } }
      const projectName = reportWithProject.project?.name || 'Unknown Project'
      const projectId = reportWithProject.project?.id || report.project_id || 'unknown'
      
      notifications.push({
        id: `report_${report.id}`,
        type: 'report',
        title: report.file_name || 'Document Upload',
        project: projectName,
        projectId: projectId,
        timestamp: report.uploaded_at || new Date().toISOString(),
        description: report.description || `Report uploaded to ${projectName}`
      })
    })

    // Process tasks
    tasks.forEach(task => {
      const taskWithRels = task as typeof task & { 
        project?: { id: string; name: string }
        assignee?: { name: string }
      }
      const projectName = taskWithRels.project?.name || 'Unknown Project'
      const projectId = taskWithRels.project?.id || task.project_id || 'unknown'
      const assigneeName = taskWithRels.assignee?.name || 'Unassigned'
      
      // Better task title handling
      const taskTitle = task.name && task.name.trim() && task.name !== 'null' 
        ? task.name 
        : `Task in ${projectName}`
      
      notifications.push({
        id: `task_${task.id}`,
        type: 'task',
        title: taskTitle,
        project: projectName,
        projectId: projectId,
        timestamp: task.updated_at || task.created_at || new Date().toISOString(),
        description: `Assigned to ${assigneeName} • Status: ${task.status || 'pending'}`,
        status: task.status || undefined,
        priority: task.priority || undefined
      })
    })

    // Process events
    events.forEach(event => {
      const eventWithProject = event as typeof event & { project?: { id: string; name: string } }
      const projectName = eventWithProject.project?.name || 'Unknown Project'
      const projectId = eventWithProject.project?.id || event.project_id || 'unknown'
      
      // Better event title handling
      const eventTitle = event.title && event.title.trim() && event.title !== 'null'
        ? event.title
        : `${event.type || 'Event'} in ${projectName}`
      
      notifications.push({
        id: `event_${event.id}`,
        type: 'event',
        title: eventTitle,
        project: projectName,
        projectId: projectId,
        timestamp: event.created_at || new Date().toISOString(),
        description: `${event.type || 'Event'} scheduled for ${new Date(event.date).toLocaleDateString()}`,
        status: event.type || undefined
      })
    })

    // Process project updates
    projects.forEach(project => {
      const isNewProject = new Date(project.created_at).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      const isUpdatedProject = new Date(project.updated_at).getTime() > new Date(project.created_at).getTime()
      
      if (isNewProject) {
        notifications.push({
          id: `project_new_${project.id}`,
          type: 'project',
          title: `New Project: ${project.name}`,
          project: project.name,
          projectId: project.id,
          timestamp: project.created_at || new Date().toISOString(),
          description: `Project created with status: ${project.status}`,
          status: project.status
        })
      } else if (isUpdatedProject) {
        notifications.push({
          id: `project_update_${project.id}`,
          type: 'project',
          title: `Project Updated: ${project.name}`,
          project: project.name,
          projectId: project.id,
          timestamp: project.updated_at || new Date().toISOString(),
          description: `Project status updated to: ${project.status}`,
          status: project.status
        })
      }
    })

    // Process personnel updates
    personnel.forEach(person => {
      const isNewPersonnel = new Date(person.created_at).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      
      if (isNewPersonnel) {
        notifications.push({
          id: `personnel_new_${person.id}`,
          type: 'personnel',
          title: `New Team Member: ${person.name}`,
          project: 'Team Management',
          projectId: 'personnel',
          timestamp: person.created_at || new Date().toISOString(),
          description: `${person.name} joined as ${person.position}`,
          status: 'active'
        })
      }
    })

    // Process recent report updates (status changes, approvals, etc.)
    recentUpdates.forEach(report => {
      const reportWithRels = report as typeof report & { 
        project?: { id: string; name: string }
        uploader?: { name: string }
      }
      const projectName = reportWithRels.project?.name || 'Unknown Project'
      const projectId = reportWithRels.project?.id || report.project_id || 'unknown'
      const uploaderName = reportWithRels.uploader?.name || 'Unknown User'
      
      let activityTitle = ''
      let activityDescription = ''
      
      switch (report.status) {
        case 'approved':
          activityTitle = `Report Approved: ${report.file_name}`
          activityDescription = `${uploaderName}'s report has been approved for ${projectName}`
          break
        case 'rejected':
          activityTitle = `Report Rejected: ${report.file_name}`
          activityDescription = `${uploaderName}'s report has been rejected for ${projectName}`
          break
        case 'revision':
          activityTitle = `Report Needs Revision: ${report.file_name}`
          activityDescription = `${uploaderName}'s report requires revision for ${projectName}`
          break
        default:
          activityTitle = `Report Status Updated: ${report.file_name}`
          activityDescription = `Status changed to ${report.status} for ${projectName}`
      }
      
      notifications.push({
        id: `report_update_${report.id}`,
        type: 'report_update',
        title: activityTitle,
        project: projectName,
        projectId: projectId,
        timestamp: report.updated_at || new Date().toISOString(),
        description: activityDescription,
        status: report.status
      })
    })

    // Sort by timestamp descending
    return notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 30) // Show more recent notifications
  }, [query.data])

  return {
    ...query,
    notifications: processedNotifications,
    rawData: query.data
  }
}

// Hook for dashboard stats - optimized aggregation
export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardStats(),
    queryFn: async () => {
      try {
        // Get all counts in parallel
        const [projectsResult, tasksResult, personnelResult, eventsResult] = await Promise.all([
          supabase
            .from('projects')
            .select('id, status', { count: 'exact', head: false }),
          
          supabase
            .from('tasks')
            .select('id, status, priority', { count: 'exact', head: false }),
          
          supabase
            .from('personnel')
            .select('id, position', { count: 'exact', head: false }),
          
          supabase
            .from('events')
            .select('id, type, date', { count: 'exact', head: false })
        ])

        // Check for errors
        if (projectsResult.error) throw projectsResult.error
        if (tasksResult.error) throw tasksResult.error
        if (personnelResult.error) throw personnelResult.error
        if (eventsResult.error) throw eventsResult.error

        // Process the data
        const projects = projectsResult.data || []
        const tasks = tasksResult.data || []
        const personnel = personnelResult.data || []
        const events = eventsResult.data || []

        return {
          projects: {
            total: projects.length,
            active: projects.filter(p => p.status === 'active').length,
            completed: projects.filter(p => p.status === 'completed').length,
            onHold: projects.filter(p => p.status === 'on_hold').length
          },
          tasks: {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            highPriority: tasks.filter(t => t.priority === 'high').length
          },
          personnel: {
            total: personnel.length,
            active: personnel.length // All personnel are considered active since no status field
          },
          events: {
            total: events.length,
            upcoming: events.filter(e => new Date(e.date) > new Date()).length,
            completed: events.filter(e => new Date(e.date) <= new Date()).length
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        throw error
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - stats don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  })
}
