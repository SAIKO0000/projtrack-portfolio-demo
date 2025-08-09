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

export class DeadlineNotificationService {
  // Check for tasks with upcoming deadlines
  static async checkTaskDeadlines(): Promise<TaskDeadline[]> {
    try {
      console.log('🔍 Checking task deadlines...');
      console.log('📅 Current date:', new Date().toISOString());
      
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

      console.log('📊 Raw tasks from database:', tasks?.length || 0);

      if (error) {
        console.error('❌ Error fetching tasks:', error);
        return [];
      }

      if (!tasks || tasks.length === 0) {
        console.log('ℹ️ No active tasks found');
        return [];
      }

      console.log('📋 All active tasks with end dates:', tasks.map(t => ({
        id: t.id,
        title: t.title,
        end_date: t.end_date,
        status: t.status
      })));

      const now = new Date();
      const tasksWithDeadlines: TaskDeadline[] = [];

      tasks.forEach(task => {
        if (!task.end_date) return;

        const endDate = new Date(task.end_date);
        const timeDiff = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

        console.log(`📅 Task "${task.title}": End date ${task.end_date}, Days remaining: ${daysRemaining}`);

        // Include tasks with 0-7 days remaining (7 days before deadline)
        if (daysRemaining >= 0 && daysRemaining <= 7) {
          const taskDeadline = {
            id: task.id,
            title: task.title,
            project_name: (task.projects as { name: string })?.name || 'Unknown Project',
            end_date: task.end_date,
            status: task.status || 'unknown',
            priority: task.priority || 'medium',
            assigned_to: task.assigned_to,
            daysRemaining
          };
          
          tasksWithDeadlines.push(taskDeadline);
          console.log('⚠️ DEADLINE ALERT:', taskDeadline);
        }
      });

      console.log(`📅 Found ${tasksWithDeadlines.length} tasks with upcoming deadlines`);
      return tasksWithDeadlines;
    } catch (error) {
      console.error('Error checking task deadlines:', error);
      return [];
    }
  }

  // Generate notification content for a task
  static generateNotificationContent(task: TaskDeadline) {
    const { title, project_name, daysRemaining, priority, status } = task;
    
    let urgencyIcon = '⏰';
    let urgencyText = '';
    
    if (daysRemaining === 0) {
      urgencyIcon = '🚨';
      urgencyText = 'DUE TODAY';
    } else if (daysRemaining === 1) {
      urgencyIcon = '⚠️';
      urgencyText = '1 day remaining';
    } else {
      urgencyText = `${daysRemaining} days remaining`;
    }

    return {
      title: `${urgencyIcon} Task Deadline Alert`,
      body: `${project_name}\n${title}\n${urgencyText} • ${status} • ${priority} priority`,
      data: {
        taskId: task.id,
        projectName: project_name,
        daysRemaining: daysRemaining.toString(),
        type: 'task_deadline'
      },
      tag: `task-deadline-${task.id}`,
      icon: '/logo.svg',
      badge: '/logo.svg',
      requireInteraction: daysRemaining <= 1, // Keep on screen for urgent tasks
    };
  }

  // Send push notification to all subscribers
  static async sendDeadlineNotifications() {
    try {
      console.log('📨 Starting deadline notification check...');
      
      const upcomingTasks = await this.checkTaskDeadlines();
      
      if (upcomingTasks.length === 0) {
        console.log('✅ No tasks with upcoming deadlines');
        return;
      }

      // For now, we'll log what notifications would be sent
      // In production, you would send these to FCM
      console.log('📬 Would send the following notifications:');
      
      upcomingTasks.forEach(task => {
        const notification = this.generateNotificationContent(task);
        console.log(`📌 ${notification.title}: ${notification.body}`);
      });

      // TODO: Implement actual FCM sending when backend is ready
      return upcomingTasks;
    } catch (error) {
      console.error('Error sending deadline notifications:', error);
      return [];
    }
  }

  // Browser-side notification for testing
  static async sendBrowserNotification(task: TaskDeadline) {
    console.log('🧪 Testing browser notification for task:', task);
    
    if (typeof window === 'undefined') {
      console.log('❌ Not in browser environment');
      return;
    }

    console.log('🔍 Notification permission:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
      console.log('❌ Cannot send browser notification - permission not granted');
      console.log('Current permission status:', Notification.permission);
      return;
    }

    const notificationContent = this.generateNotificationContent(task);
    console.log('📨 Notification content:', notificationContent);
    
    try {
      const notification = new Notification(notificationContent.title, {
        body: notificationContent.body,
        icon: notificationContent.icon,
        badge: notificationContent.badge,
        tag: notificationContent.tag,
        requireInteraction: notificationContent.requireInteraction,
        data: notificationContent.data
      });

      console.log('✅ Notification created successfully:', notification);

      notification.onclick = () => {
        console.log('📱 Notification clicked for task:', task.id);
        // TODO: Navigate to task or project page
        window.focus();
        notification.close();
      };

      notification.onshow = () => {
        console.log('👁️ Notification shown');
      };

      notification.onerror = (error) => {
        console.error('❌ Notification error:', error);
      };

      notification.onclose = () => {
        console.log('🔐 Notification closed');
      };

      // Auto-close after 10 seconds unless it requires interaction
      if (!notificationContent.requireInteraction) {
        setTimeout(() => {
          console.log('⏰ Auto-closing notification');
          notification.close();
        }, 10000);
      }
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
    }
  }
}
