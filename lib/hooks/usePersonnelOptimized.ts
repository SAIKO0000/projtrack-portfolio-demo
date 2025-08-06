import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase, queryKeys } from '@/lib/supabase-query'
import type { Database } from '@/lib/supabase.types'

type Personnel = Database['public']['Tables']['personnel']['Row']
type PersonnelInsert = Database['public']['Tables']['personnel']['Insert']
type PersonnelUpdate = Database['public']['Tables']['personnel']['Update']

// Enhanced Personnel Query Hook with Realtime
export function usePersonnelQuery() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.personnel(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personnel')
        .select(`
          *,
          tasks:tasks(count),
          projects:project_personnel(
            project:projects(id, name, status)
          )
        `)
        .order('name')
      
      if (error) {
        console.error('Error fetching personnel:', error)
        throw error
      }
      return data || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - personnel data changes infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  })

  // Realtime subscription for personnel changes
  useEffect(() => {
    const channel = supabase
      .channel('personnel_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'personnel'
        },
        (payload) => {
          console.log('Personnel realtime update:', payload)
          queryClient.invalidateQueries({ queryKey: queryKeys.personnel() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

// Single Personnel Query
export function usePersonQuery(personnelId: string) {
  const query = useQuery({
    queryKey: queryKeys.person(personnelId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personnel')
        .select(`
          *,
          tasks(
            id, title, status, priority, due_date, progress,
            project:projects(id, name)
          ),
          project_assignments:project_personnel(
            project:projects(id, name, status, description),
            role, assigned_at
          )
        `)
        .eq('id', personnelId)
        .single()
      
      if (error) {
        console.error('Error fetching person:', error)
        throw error
      }
      return data
    },
    enabled: !!personnelId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return query
}

// Create Personnel Mutation
export function useCreatePersonnel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newPersonnel: PersonnelInsert) => {
      const { data, error } = await supabase
        .from('personnel')
        .insert(newPersonnel)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating personnel:', error)
        throw error
      }
      return data
    },
    onSuccess: (data) => {
      // Update personnel list cache
      queryClient.setQueryData(queryKeys.personnel(), (old: Personnel[] = []) => {
        return [...old, data].sort((a, b) => a.name.localeCompare(b.name))
      })
    },
  })
}

// Update Personnel Mutation
export function useUpdatePersonnel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PersonnelUpdate }) => {
      const { data, error } = await supabase
        .from('personnel')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating personnel:', error)
        throw error
      }
      return data
    },
    onSuccess: (data) => {
      // Update specific person cache
      queryClient.setQueryData(queryKeys.person(data.id), data)
      
      // Update personnel list cache
      queryClient.setQueryData(queryKeys.personnel(), (old: Personnel[] = []) => {
        return old.map(person => person.id === data.id ? data : person)
      })
    }
  })
}

// Delete Personnel Mutation
export function useDeletePersonnel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (personnelId: string) => {
      const { error } = await supabase
        .from('personnel')
        .delete()
        .eq('id', personnelId)
      
      if (error) {
        console.error('Error deleting personnel:', error)
        throw error
      }
      return personnelId
    },
    onSuccess: (deletedId) => {
      // Remove from personnel list cache
      queryClient.setQueryData(queryKeys.personnel(), (old: Personnel[] = []) => {
        return old.filter(person => person.id !== deletedId)
      })
      
      // Remove specific person cache
      queryClient.removeQueries({ queryKey: queryKeys.person(deletedId) })
    }
  })
}

// Active Personnel Query (only active/available personnel)
export function useActivePersonnelQuery() {
  return useQuery({
    queryKey: [...queryKeys.personnel(), 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personnel')
        .select('id, name, email, role, department, phone')
        .eq('status', 'active')
        .order('name')
      
      if (error) {
        console.error('Error fetching active personnel:', error)
        throw error
      }
      return data || []
    },
    staleTime: 20 * 60 * 1000, // 20 minutes - active status changes rarely
  })
}

// Personnel by Role Query
export function usePersonnelByRole(role?: string) {
  return useQuery({
    queryKey: [...queryKeys.personnel(), 'role', role],
    queryFn: async () => {
      let query = supabase
        .from('personnel')
        .select('id, name, email, role, department')
        .order('name')
      
      if (role) {
        query = query.eq('role', role)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching personnel by role:', error)
        throw error
      }
      return data || []
    },
    enabled: true,
    staleTime: 15 * 60 * 1000,
  })
}
