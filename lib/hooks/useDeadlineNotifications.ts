import { useState, useEffect, useCallback } from 'react';
import { DeadlineNotificationService } from '@/lib/deadline-notification-service';

interface TaskDeadline {
  id: string;
  title: string;
  project_name: string;
  end_date: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  daysRemaining: number;
}

interface UseDeadlineNotifications {
  upcomingTasks: TaskDeadline[];
  isLoading: boolean;
  checkDeadlines: () => Promise<void>;
  lastChecked: Date | null;
}

export const useDeadlineNotifications = (): UseDeadlineNotifications => {
  const [upcomingTasks, setUpcomingTasks] = useState<TaskDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkDeadlines = useCallback(async () => {
    setIsLoading(true);
    try {
      const tasks = await DeadlineNotificationService.checkTaskDeadlines();
      setUpcomingTasks(tasks);
      setLastChecked(new Date());
      
      // Log summary
      if (tasks.length > 0) {
        console.log(`📅 Found ${tasks.length} tasks with upcoming deadlines:`);
        tasks.forEach(task => {
          const urgency = task.daysRemaining === 0 ? '🚨 DUE TODAY' : 
                         task.daysRemaining === 1 ? '⚠️ 1 day remaining' : 
                         `⏰ ${task.daysRemaining} days remaining`;
          console.log(`  • ${task.project_name}: ${task.title} (${urgency})`);
        });
      }
    } catch (error) {
      console.error('Error checking deadlines:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check deadlines on mount and then every 30 minutes
  useEffect(() => {
    checkDeadlines();
    
    const interval = setInterval(() => {
      checkDeadlines();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [checkDeadlines]);

  return {
    upcomingTasks,
    isLoading,
    checkDeadlines,
    lastChecked,
  };
};
