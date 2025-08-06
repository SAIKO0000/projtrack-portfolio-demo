import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import { cache, CACHE_KEYS } from '@/lib/cache';

export type Task = Database['public']['Tables']['tasks']['Row'];

// Import the global invalidation function from useGanttTasks to keep them synchronized
import { triggerTasksRefresh as triggerGanttRefresh } from './useGanttTasks';

// Global task cache invalidation
let globalTasksVersion = 0;
const versionWatchers: Set<() => void> = new Set();

export const triggerTasksRefresh = () => {
  globalTasksVersion++;
  // Clear cache when triggered
  cache.invalidate(CACHE_KEYS.TASKS);
  triggerGanttRefresh(); // Also trigger gantt refresh
  versionWatchers.forEach(watcher => watcher());
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVersion, setLastVersion] = useState(0);

  const fetchTasks = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Use cache if available and not forcing refresh
      if (!forceRefresh) {
        const cachedTasks = cache.get<Task[]>(CACHE_KEYS.TASKS);
        if (cachedTasks) {
          setTasks(cachedTasks);
          setLoading(false);
          setLastVersion(globalTasksVersion);
          return;
        }
      }

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const tasksData = data || [];
      setTasks(tasksData);
      setLastVersion(globalTasksVersion);
      
      // Update cache
      cache.set(CACHE_KEYS.TASKS, tasksData);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  // Watch for global cache invalidation - reduced frequency
  useEffect(() => {
    const watcher = () => {
      if (lastVersion < globalTasksVersion) {
        setLastVersion(globalTasksVersion);
        fetchTasks(true); // Force refresh when version changes
      }
    };

    versionWatchers.add(watcher);
    return () => {
      versionWatchers.delete(watcher);
    };
  }, [lastVersion, fetchTasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
  };
}
