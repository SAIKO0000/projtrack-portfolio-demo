import { supabase } from '@/lib/supabase';

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

export class TestNotificationService {
  // Check for tasks without authentication (for testing)
  static async getTestTasks(): Promise<TaskDeadline[]> {
    try {
      console.log('🧪 [Test] Fetching tasks for notification testing...');
      
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          end_date,
          status,
          priority,
          assigned_to,
          projects!inner(name)
        `)
        .neq('status', 'completed')
        .not('end_date', 'is', null);

      if (error) {
        console.error('❌ [Test] Error fetching tasks:', error);
        return [];
      }

      if (!tasks || tasks.length === 0) {
        console.log('ℹ️ [Test] No active tasks found, creating mock data');
        return this.getMockTasks();
      }

      const now = new Date();
      const tasksWithDeadlines: TaskDeadline[] = [];

      tasks.forEach(task => {
        if (!task.end_date) return;

        const endDate = new Date(task.end_date);
        const timeDiff = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Include tasks with 0-7 days remaining
        if (daysRemaining >= 0 && daysRemaining <= 7) {
          const taskDeadline = {
            id: task.id,
            title: task.title,
            project_name: Array.isArray(task.projects) ? 
              task.projects[0]?.name || 'Unknown Project' : 
              (task.projects as unknown as { name: string })?.name || 'Unknown Project',
            end_date: task.end_date,
            status: task.status || 'in-progress',
            priority: task.priority || 'medium',
            assigned_to: task.assigned_to,
            daysRemaining
          };
          
          tasksWithDeadlines.push(taskDeadline);
        }
      });

      console.log(`📅 [Test] Found ${tasksWithDeadlines.length} real tasks with upcoming deadlines`);
      
      // If no real tasks, add mock data for testing
      if (tasksWithDeadlines.length === 0) {
        console.log('📋 [Test] No upcoming deadlines found, adding mock tasks for testing');
        return this.getMockTasks();
      }
      
      return tasksWithDeadlines;
    } catch (error) {
      console.error('❌ [Test] Error checking tasks:', error);
      return this.getMockTasks();
    }
  }

  // Create mock tasks for testing when no real tasks exist
  static getMockTasks(): TaskDeadline[] {
    const today = new Date();
    
    return [
      {
        id: 'test-1',
        title: 'Power Grid Installation',
        project_name: 'Cebu Industrial Park Power Systems',
        end_date: new Date(today.getTime() + 0 * 24 * 60 * 60 * 1000).toISOString(), // Due today
        status: 'in-progress',
        priority: 'high',
        assigned_to: 'test-user',
        daysRemaining: 0
      },
      {
        id: 'test-2',
        title: 'Electrical Upgrade',
        project_name: 'Manila Bay Electrical Grid',
        end_date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Due tomorrow
        status: 'in-progress',
        priority: 'high',
        assigned_to: 'test-user',
        daysRemaining: 1
      },
      {
        id: 'test-3',
        title: 'Wiring Installation',
        project_name: 'Davao Commercial Complex',
        end_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Due in 3 days
        status: 'pending',
        priority: 'medium',
        assigned_to: 'test-user',
        daysRemaining: 3
      },
      {
        id: 'test-4',
        title: 'Cable Management System',
        project_name: 'Iloilo Business District',
        end_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Due in 5 days
        status: 'not-started',
        priority: 'low',
        assigned_to: 'test-user',
        daysRemaining: 5
      }
    ];
  }

  // Send individual task notifications (the format you requested)
  static async sendTestNotifications(): Promise<void> {
    try {
      // Request permission first
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('❌ [Test] Notification permission denied');
          alert('Please enable notifications to test the notification system!');
          return;
        }
      } else {
        console.log('❌ [Test] Browser does not support notifications');
        alert('Your browser does not support notifications!');
        return;
      }

      const tasks = await this.getTestTasks();
      console.log(`🧪 [Test] Sending ${tasks.length} individual task notifications...`);

      if (tasks.length === 0) {
        console.log('ℹ️ [Test] No tasks to notify about');
        return;
      }

      // Send individual notifications for each task
      tasks.forEach((task, index) => {
        setTimeout(() => {
          const dueDate = new Date(task.end_date).toLocaleDateString();
          const urgencyIcon = task.daysRemaining === 0 ? '🚨' : 
                            task.daysRemaining <= 1 ? '⚠️' : '⏰';
          
          const daysText = task.daysRemaining === 0 ? 'DUE TODAY' : 
                          task.daysRemaining === 1 ? '1 day' : 
                          `${task.daysRemaining} days`;

          // Create notification in the exact format you requested
          const title = task.project_name;
          const body = `${task.title}\n${task.status}, ${task.priority} priority\n${dueDate}\n${urgencyIcon} ${daysText}`;
          
          console.log(`📋 [Test] Sending notification ${index + 1}:`, { title, body });
          
          new Notification(title, {
            body: body,
            icon: '/logo.svg',
            badge: '/logo.svg',
            tag: `test-task-${task.id}`,
            requireInteraction: task.daysRemaining <= 1
          });

        }, index * 2500); // Stagger notifications by 2.5 seconds for better visibility
      });

      console.log(`✅ [Test] All ${tasks.length} test notifications scheduled`);
      
      // Show success message after all notifications
      setTimeout(() => {
        alert(`✅ Test completed! Sent ${tasks.length} individual task notifications.\n\nCheck your browser notifications to see the format:\n"Project Name"\n"Task Title"\n"status, priority"\n"due date"\n"⏰ X days"`);
      }, tasks.length * 2500 + 1000);

    } catch (error) {
      console.error('❌ [Test] Error sending test notifications:', error);
      alert('❌ Error sending test notifications. Check console for details.');
    }
  }

  // Quick test with just one notification
  static async sendSingleTestNotification(): Promise<void> {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('❌ [Test] Notification permission denied');
          return;
        }
      }

      // Create a single test notification in your requested format
      const title = 'Cebu Industrial Park Power Systems';
      const body = `Power Grid Installation\nin-progress, high priority\n${new Date().toLocaleDateString()}\n🚨 DUE TODAY`;
      
      console.log('🧪 [Test] Sending single test notification:', { title, body });
      
      new Notification(title, {
        body: body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'single-test',
        requireInteraction: true
      });

      console.log('✅ [Test] Single test notification sent');

    } catch (error) {
      console.error('❌ [Test] Error sending single test notification:', error);
    }
  }
}
