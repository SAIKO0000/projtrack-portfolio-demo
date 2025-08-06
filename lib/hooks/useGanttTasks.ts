import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

export type GanttTask = Database['public']['Tables']['tasks']['Row'];

export interface GanttTaskWithDependencies extends GanttTask {
  dependencyTasks?: GanttTask[];
}

// Global task cache invalidation
let globalTasksVersion = 0;
const invalidateGlobalTasks = () => {
  globalTasksVersion++;
};

// Export function to trigger cache invalidation from anywhere
export const triggerTasksRefresh = () => {
  invalidateGlobalTasks();
};

export function useGanttTasks(projectId?: string) {
  const [tasks, setTasks] = useState<GanttTaskWithDependencies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVersion, setLastVersion] = useState(0);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('tasks')
        .select('*')
        .not('start_date', 'is', null)
        .not('end_date', 'is', null)
        .order('start_date', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Optimize dependency fetching with a single query
      const tasksWithDependencies: GanttTaskWithDependencies[] = [];
      const allDependencyIds = new Set<string>();
        // Collect all dependency IDs
      (data || []).forEach(task => {
        if (task.dependencies && task.dependencies.length > 0) {
          task.dependencies.forEach((depId: string) => allDependencyIds.add(depId));
        }
      });

      // Fetch all dependencies in one query if there are any
      let dependencyTasksMap: Record<string, GanttTask> = {};
      if (allDependencyIds.size > 0) {
        const { data: depTasks } = await supabase
          .from('tasks')
          .select('*')
          .in('id', Array.from(allDependencyIds));
        
        dependencyTasksMap = (depTasks || []).reduce((acc, task) => {
          acc[task.id] = task;
          return acc;
        }, {} as Record<string, GanttTask>);
      }

      // Map tasks with their dependencies
      (data || []).forEach(task => {        if (task.dependencies && task.dependencies.length > 0) {
          const dependencyTasks = task.dependencies
            .map((depId: string) => dependencyTasksMap[depId])
            .filter(Boolean);
          
          tasksWithDependencies.push({
            ...task,
            dependencyTasks
          });
        } else {
          tasksWithDependencies.push(task);
        }
      });setTasks(tasksWithDependencies);
      setLastVersion(globalTasksVersion);
    } catch (err) {
      console.error('Error fetching Gantt tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  const createTask = async (taskData: Omit<GanttTask, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      // Optimistic update instead of full refresh
      setTasks(prev => [...prev, data]);
      
      // Invalidate global cache for other components
      invalidateGlobalTasks();
      return data;
    } catch (err) {
      console.error('Error creating task:', err);
      // If optimistic update failed, do a full refresh
      await fetchTasks();
      throw err;
    }
  };  const updateTask = async (id: string, updates: Partial<GanttTask>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Optimistic update instead of full refresh
      setTasks(prev => prev.map(task => task.id === id ? { ...task, ...data } : task));
      
      // Invalidate global cache for other components
      invalidateGlobalTasks();
      return data;
    } catch (err) {
      console.error('Error updating task:', err);
      // If optimistic update failed, do a full refresh
      await fetchTasks();
      throw err;
    }
  };  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Optimistic update instead of full refresh
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // Invalidate global cache for other components
      invalidateGlobalTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      // If optimistic update failed, do a full refresh
      await fetchTasks();
      throw err;
    }
  };

  const updateTaskProgress = async (id: string, progress: number) => {
    return updateTask(id, { progress });
  };

  const updateTaskStatus = async (id: string, status: string) => {
    return updateTask(id, { status });
  };
  useEffect(() => {
    fetchTasks();
  }, [projectId, fetchTasks]);  // Watch for global cache invalidation
  useEffect(() => {
    if (lastVersion < globalTasksVersion) {
      setLastVersion(globalTasksVersion);
      fetchTasks();
    }
  }, [lastVersion, fetchTasks]);
  
  // Poll for global cache changes with reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastVersion < globalTasksVersion) {
        setLastVersion(globalTasksVersion);
        fetchTasks();
      }
    }, 2000); // Changed from 10000ms to 2000ms for better responsiveness

    return () => clearInterval(interval);
  }, [lastVersion, fetchTasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskProgress,
    updateTaskStatus,
  };
}
