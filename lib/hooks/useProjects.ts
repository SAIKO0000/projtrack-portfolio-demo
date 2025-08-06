import { useState, useEffect, useCallback } from 'react'
import { supabase, type Project } from '@/lib/supabase'
import { cache, CACHE_KEYS } from '@/lib/cache'
import { withAuthErrorHandling } from '@/lib/auth-utils'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      // Use cache if available and not forcing refresh
      if (!forceRefresh) {
        const cachedProjects = cache.get<Project[]>(CACHE_KEYS.PROJECTS);
        if (cachedProjects) {
          setProjects(cachedProjects);
          setLoading(false);
          return;
        }
      }
      
      const result = await withAuthErrorHandling(async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || [];
      }, []);

      if (result) {
        setProjects(result);
        // Update cache
        cache.set(CACHE_KEYS.PROJECTS, result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select()
        .single()

      if (error) throw error
      
      // Optimistic update
      const newProjects = [data, ...projects];
      setProjects(newProjects);
      
      // Update cache
      cache.set(CACHE_KEYS.PROJECTS, newProjects);
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      throw err
    }
  }
  
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // Optimistic update
      const updatedProjects = projects.map(p => p.id === id ? data : p);
      setProjects(updatedProjects);
      
      // Update cache
      cache.set(CACHE_KEYS.PROJECTS, updatedProjects);
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      throw err
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Optimistic update
      const filteredProjects = projects.filter(p => p.id !== id);
      setProjects(filteredProjects);
      
      // Update cache
      cache.set(CACHE_KEYS.PROJECTS, filteredProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
}