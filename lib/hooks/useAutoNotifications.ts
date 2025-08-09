import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useFCM } from '@/lib/hooks/useFCM';
import { DeadlineNotificationService } from '@/lib/deadline-notification-service';
import { toast } from 'react-hot-toast';

/**
 * Hook to automatically trigger notifications after user login
 * Shows individual task notifications with specific details
 * Triggers only once per login session
 */
export const useAutoNotifications = () => {
  const { user, session } = useAuth();
  const { notificationPermission, requestPermission } = useFCM();
  const notificationSentRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  const triggerLoginNotifications = useCallback(async () => {
    console.log('🚀 triggerLoginNotifications called', { 
      hasUser: !!user, 
      hasSession: !!session, 
      userEmail: user?.email,
      notificationPermission,
      currentSessionId: session?.access_token?.slice(-10),
      lastSessionId: sessionIdRef.current?.slice(-10),
      alreadySent: notificationSentRef.current
    });
    
    if (!user || !session) {
      console.log('❌ No user or session, skipping notifications');
      return;
    }

    // Check if this is a new session
    const currentSessionId = session.access_token;
    if (sessionIdRef.current === currentSessionId && notificationSentRef.current) {
      console.log('🔄 Same session, notifications already sent - skipping');
      return;
    }

    // Update session tracking
    sessionIdRef.current = currentSessionId;
    notificationSentRef.current = true;

    try {
      // Request permission if not granted
      if (notificationPermission !== 'granted') {
        console.log('🔔 Requesting notification permission...');
        await requestPermission();
        // Check if permission was granted after request
        if ('Notification' in window && Notification.permission !== 'granted') {
          console.log('❌ Notification permission not granted after request');
          return;
        } else {
          console.log('✅ Notification permission granted');
        }
      } else {
        console.log('✅ Notification permission already granted');
      }

      // Small delay to ensure UI is settled
      console.log('⏳ Starting 2-second delay before checking deadlines...');
      setTimeout(async () => {
        // Test basic notification first
        console.log('🧪 Testing basic notification capability...');
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🔔 ProjTrack Login Detected', {
            body: `Welcome back, ${user.email}! Checking for deadline notifications...`,
            icon: '/logo.svg',
            tag: 'login-test'
          });
        }
        try {
          // Check for upcoming deadlines and auto-notify
          console.log('🔔 Starting auto-notification check after login...');
          const upcomingTasks = await DeadlineNotificationService.checkTaskDeadlines();
          console.log('📋 Tasks found for notification:', upcomingTasks.length);
          
          if (upcomingTasks.length > 0) {
            // Send individual notifications for each task with detailed info
            upcomingTasks.forEach((task, index) => {
              setTimeout(() => {
                console.log(`� Sending individual task notification: ${task.title}`);
                
                if ('Notification' in window && Notification.permission === 'granted') {
                  // Format the notification with specific task details
                  const dueDate = new Date(task.end_date).toLocaleDateString();
                  const urgencyIcon = task.daysRemaining === 0 ? '🚨' : 
                                    task.daysRemaining <= 1 ? '⚠️' : '⏰';
                  
                  const title = task.project_name;
                  const body = `${task.title}\n${task.status}, ${task.priority} priority\n${dueDate}\n${urgencyIcon} ${task.daysRemaining === 0 ? 'DUE TODAY' : task.daysRemaining === 1 ? '1 day' : task.daysRemaining + ' days'}`;
                  
                  new Notification(title, {
                    body: body,
                    icon: '/logo.svg',
                    badge: '/logo.svg',
                    tag: `task-${task.id}`,
                    requireInteraction: task.daysRemaining <= 1
                  });
                }

                // Also show individual toast notifications
                const urgencyIcon = task.daysRemaining === 0 ? '🚨' : 
                                  task.daysRemaining <= 1 ? '⚠️' : '⏰';
                const daysText = task.daysRemaining === 0 ? 'DUE TODAY' : 
                               task.daysRemaining === 1 ? '1 day' : 
                               `${task.daysRemaining} days`;
                
                const toastMessage = `${task.project_name}\n${task.title}\n${task.status}, ${task.priority} priority\n${urgencyIcon} ${daysText}`;
                
                if (task.daysRemaining <= 1) {
                  toast.error(toastMessage, {
                    duration: 8000,
                  });
                } else if (task.daysRemaining <= 3) {
                  toast(toastMessage, {
                    duration: 6000,
                    icon: '⚠️',
                  });
                } else {
                  toast(toastMessage, {
                    duration: 4000,
                    icon: '⏰',
                  });
                }
              }, index * 2000); // Stagger notifications by 2 seconds
            });

            console.log(`🔔 Auto-notification completed for ${user.email}: ${upcomingTasks.length} individual task notifications sent`);
          } else {
            // No deadlines - show friendly welcome
            console.log('✅ No upcoming deadlines found - showing welcome message');
            toast.success(`👋 Welcome back! All tasks are on track.`, {
              duration: 4000,
            });
          }
        } catch (error) {
          console.error('❌ Error in auto-notification:', error);
        }
      }, 2000); // 2-second delay for smooth UX

    } catch (error) {
      console.error('❌ Error setting up auto-notifications:', error);
    }
  }, [user, session, notificationPermission, requestPermission]);

  // Trigger notifications when user logs in
  useEffect(() => {
    console.log('🔄 useAutoNotifications effect triggered', { 
      hasUser: !!user, 
      hasSession: !!session, 
      userEmail: user?.email 
    });
    
    // Don't wait for FCM token - use browser notifications directly
    if (user && session) {
      console.log('✅ User and session ready, triggering login notifications');
      triggerLoginNotifications();
    } else {
      console.log('⏳ Waiting for user and session');
    }
  }, [user, session, triggerLoginNotifications]);

  return {
    triggerLoginNotifications
  };
};
