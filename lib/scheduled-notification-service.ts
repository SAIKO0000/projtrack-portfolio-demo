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

export class ScheduledNotificationService {
  private static NOTIFICATION_TIMES = [
    { hour: 7, minute: 0 },   // 7:00 AM
    { hour: 12, minute: 0 },  // 12:00 PM
    { hour: 15, minute: 0 }   // 3:00 PM
  ];

  // Check if current time matches any of our notification times
  static isNotificationTime(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return this.NOTIFICATION_TIMES.some(time => 
      time.hour === currentHour && currentMinute >= time.minute && currentMinute < time.minute + 1
    );
  }

  // Get next notification time
  static getNextNotificationTime(): Date {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const time of this.NOTIFICATION_TIMES) {
      const notificationTime = new Date(today.getTime() + time.hour * 60 * 60 * 1000 + time.minute * 60 * 1000);
      if (notificationTime > now) {
        return notificationTime;
      }
    }
    
    // If no more times today, return first time tomorrow
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    return new Date(tomorrow.getTime() + this.NOTIFICATION_TIMES[0].hour * 60 * 60 * 1000);
  }

  // Check for upcoming deadlines (same as before but with more detailed info)
  static async checkTaskDeadlines(): Promise<TaskDeadline[]> {
    try {
      console.log('🔍 [Scheduled] Checking task deadlines...');
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

      if (error) {
        console.error('❌ Error fetching tasks:', error);
        return [];
      }

      if (!tasks || tasks.length === 0) {
        console.log('ℹ️ No active tasks found');
        return [];
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
            project_name: (task.projects as { name: string })?.name || 'Unknown Project',
            end_date: task.end_date,
            status: task.status || 'unknown',
            priority: task.priority || 'medium',
            assigned_to: task.assigned_to,
            daysRemaining
          };
          
          tasksWithDeadlines.push(taskDeadline);
        }
      });

      console.log(`📅 [Scheduled] Found ${tasksWithDeadlines.length} tasks with upcoming deadlines`);
      return tasksWithDeadlines;
    } catch (error) {
      console.error('Error checking task deadlines:', error);
      return [];
    }
  }

  // Send scheduled notification with specific task details
  static async sendScheduledNotification(): Promise<void> {
    try {
      const tasks = await this.checkTaskDeadlines();
      
      if (tasks.length === 0) {
        console.log('✅ [Scheduled] No upcoming deadlines - skipping notification');
        return;
      }

      const urgentTasks = tasks.filter(task => task.daysRemaining <= 3);
      const warningTasks = tasks.filter(task => task.daysRemaining > 3 && task.daysRemaining <= 7);
      
      console.log(`📊 [Scheduled] Task breakdown: ${urgentTasks.length} urgent, ${warningTasks.length} warning`);

      // Create notification content
      let notificationTitle = '';
      let notificationBody = '';
      let taskList = '';

      if (urgentTasks.length > 0) {
        notificationTitle = `🚨 ${urgentTasks.length} urgent deadline${urgentTasks.length > 1 ? 's' : ''} (≤3 days)${warningTasks.length > 0 ? ` + ${warningTasks.length} upcoming (4-7 days)` : ''}!`;
        
        // List specific urgent tasks
        const urgentTaskList = urgentTasks.slice(0, 3).map(task => {
          const dueText = task.daysRemaining === 0 ? 'DUE TODAY' : 
                         task.daysRemaining === 1 ? '1 day left' : 
                         `${task.daysRemaining} days left`;
          return `• ${task.project_name}: ${task.title} (${dueText})`;
        }).join('\n');
        
        taskList = urgentTaskList;
        if (urgentTasks.length > 3) {
          taskList += `\n+ ${urgentTasks.length - 3} more urgent task${urgentTasks.length - 3 > 1 ? 's' : ''}`;
        }
        
        notificationBody = `Urgent tasks requiring attention:\n${taskList}`;
      } else if (warningTasks.length > 0) {
        notificationTitle = `⚠️ ${warningTasks.length} task${warningTasks.length > 1 ? 's' : ''} due in next 7 days`;
        
        // List specific warning tasks
        const warningTaskList = warningTasks.slice(0, 3).map(task => 
          `• ${task.project_name}: ${task.title} (${task.daysRemaining} days left)`
        ).join('\n');
        
        taskList = warningTaskList;
        if (warningTasks.length > 3) {
          taskList += `\n+ ${warningTasks.length - 3} more task${warningTasks.length - 3 > 1 ? 's' : ''}`;
        }
        
        notificationBody = `Upcoming deadlines:\n${taskList}`;
      }

      // Send browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        console.log('📢 [Scheduled] Sending notification:', notificationTitle);
        
        new Notification(notificationTitle, {
          body: notificationBody,
          icon: '/logo.svg',
          badge: '/logo.svg',
          tag: 'scheduled-deadlines',
          requireInteraction: urgentTasks.length > 0
        });
      } else {
        console.log('❌ [Scheduled] Notification permission not granted');
      }

      // Log the notification content for debugging
      console.log('🔔 [Scheduled] Notification sent:', {
        title: notificationTitle,
        tasks: tasks.length,
        urgent: urgentTasks.length,
        warning: warningTasks.length
      });

    } catch (error) {
      console.error('❌ [Scheduled] Error sending notification:', error);
    }
  }

  // Start scheduled notification service
  static startScheduledNotifications(): NodeJS.Timeout {
    console.log('🚀 [Scheduled] Starting scheduled notification service');
    console.log('⏰ Notification times: 7:00 AM, 12:00 PM, 3:00 PM');
    
    // Check every minute for notification times
    const checkInterval = setInterval(async () => {
      if (this.isNotificationTime()) {
        console.log('⏰ [Scheduled] Notification time reached');
        await this.sendScheduledNotification();
      }
    }, 60000); // Check every minute

    // Immediate check if we're at a notification time
    if (this.isNotificationTime()) {
      console.log('⏰ [Scheduled] Immediate notification time detected');
      this.sendScheduledNotification();
    }

    console.log('✅ [Scheduled] Notification service started');
    console.log(`⏰ Next notification at: ${this.getNextNotificationTime().toLocaleString()}`);
    
    return checkInterval;
  }

  // Request notification permission
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('❌ Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}
