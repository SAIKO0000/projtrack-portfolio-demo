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
        const [photosResult, reportsResult, tasksResult, eventsResult] = await Promise.all([
          // Recent photos - handle case where project relation might not exist
          supabase
            .from('photos')
            .select(`
              id, description, file_url, taken_at, uploaded_at, uploaded_by, project_id,
              project:projects(id, name)
            `)
            .order('uploaded_at', { ascending: false })
            .limit(10)
            .then(result => {
              if (result.error && result.error.code === 'PGRST116') {
                // Handle missing foreign key relation gracefully
                return supabase
                  .from('photos')
                  .select('id, description, file_url, taken_at, uploaded_at, uploaded_by, project_id')
                  .order('uploaded_at', { ascending: false })
                  .limit(10)
              }
              return result
            }),

          // Recent reports
          supabase
            .from('reports')
            .select(`
              id, title, file_url, uploaded_at, uploaded_by, description, project_id,
              project:projects(id, name)
            `)
            .order('uploaded_at', { ascending: false })
            .limit(10)
            .then(result => {
              if (result.error && result.error.code === 'PGRST116') {
                return supabase
                  .from('reports')
                  .select('id, title, file_url, uploaded_at, uploaded_by, description, project_id')
                  .order('uploaded_at', { ascending: false })
                  .limit(10)
              }
              return result
            }),

          // Recent tasks
          supabase
            .from('tasks')
            .select(`
              id, title, status, priority, due_date, created_at, updated_at, project_id, assigned_to,
              project:projects(id, name),
              assignee:personnel(name)
            `)
            .order('updated_at', { ascending: false })
            .limit(10)
            .then(result => {
              if (result.error && result.error.code === 'PGRST116') {
                return supabase
                  .from('tasks')
                  .select('id, title, status, priority, due_date, created_at, updated_at, project_id, assigned_to')
                  .order('updated_at', { ascending: false })
                  .limit(10)
              }
              return result
            }),

          // Recent events
          supabase
            .from('events')
            .select(`
              id, title, start_date, end_date, type, status, created_at, project_id,
              project:projects(id, name)
            `)
            .order('created_at', { ascending: false })
            .limit(10)
            .then(result => {
              if (result.error && result.error.code === 'PGRST116') {
                return supabase
                  .from('events')
                  .select('id, title, start_date, end_date, type, status, created_at, project_id')
                  .order('created_at', { ascending: false })
                  .limit(10)
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

        return {
          photos: photosResult.data || [],
          reports: reportsResult.data || [],
          tasks: tasksResult.data || [],
          events: eventsResult.data || []
        }
      } catch (error) {
        console.error('Error fetching notifications data:', error)
        // Return empty data instead of throwing to prevent component crashes
        return {
          photos: [],
          reports: [],
          tasks: [],
          events: []
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // Memoized notification processing - prevents unnecessary re-renders
  const processedNotifications = useMemo(() => {
    if (!query.data) return []

    const { photos, reports, tasks, events } = query.data
    const notifications: Array<{
      id: string
      type: 'photo' | 'report' | 'task' | 'event'
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
      const projectName = photo.project?.name || 'Unknown Project'
      const projectId = photo.project?.id || photo.project_id || 'unknown'
      
      notifications.push({
        id: `photo_${photo.id}`,
        type: 'photo',
        title: `New photo uploaded: ${photo.description || 'Untitled'}`,
        project: projectName,
        projectId: projectId,
        timestamp: photo.uploaded_at || photo.taken_at || new Date().toISOString(),
        description: photo.description
      })
    })

    // Process reports
    reports.forEach(report => {
      const projectName = report.project?.name || 'Unknown Project'
      const projectId = report.project?.id || report.project_id || 'unknown'
      
      notifications.push({
        id: `report_${report.id}`,
        type: 'report',
        title: `New report uploaded: ${report.title}`,
        project: projectName,
        projectId: projectId,
        timestamp: report.uploaded_at || new Date().toISOString(),
        description: report.description
      })
    })

    // Process tasks
    tasks.forEach(task => {
      const projectName = task.project?.name || 'Unknown Project'
      const projectId = task.project?.id || task.project_id || 'unknown'
      const assigneeName = task.assignee?.name || 'Unassigned'
      
      notifications.push({
        id: `task_${task.id}`,
        type: 'task',
        title: `Task activity: ${task.title}`,
        project: projectName,
        projectId: projectId,
        timestamp: task.updated_at || task.created_at || new Date().toISOString(),
        description: `Assigned to ${assigneeName}`,
        status: task.status,
        priority: task.priority
      })
    })

    // Process events
    events.forEach(event => {
      const projectName = event.project?.name || 'Unknown Project'
      const projectId = event.project?.id || event.project_id || 'unknown'
      
      notifications.push({
        id: `event_${event.id}`,
        type: 'event',
        title: `New event: ${event.title}`,
        project: projectName,
        projectId: projectId,
        timestamp: event.created_at || new Date().toISOString(),
        status: event.status
      })
    })

    // Sort by timestamp descending
    return notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 15) // Limit to 15 most recent notifications
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
            .select('id, status', { count: 'exact', head: false }),
          
          supabase
            .from('events')
            .select('id, type, status', { count: 'exact', head: false })
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
            active: personnel.filter(p => p.status === 'active').length
          },
          events: {
            total: events.length,
            upcoming: events.filter(e => e.status === 'scheduled').length,
            completed: events.filter(e => e.status === 'completed').length
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
