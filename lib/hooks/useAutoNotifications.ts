import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useFCM } from '@/lib/hooks/useFCM';
import { MobileNotificationService } from '@/lib/mobile-notification-service';
import { enhancedNotificationService } from '@/lib/enhanced-notification-service';
import { toast } from 'react-hot-toast';

/**
 * Hook to automatically trigger notifications after user login
 * Shows individual task notifications with specific details
 * Triggers only once per login session with proper session tracking
 */
export const useAutoNotifications = () => {
  const { user, session } = useAuth();
  const { notificationPermission, requestPermission } = useFCM();
  const notificationSentRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const lastNotificationTimeRef = useRef<number>(0);

  const triggerLoginNotifications = useCallback(async () => {
    console.log('🚀 triggerLoginNotifications called', { 
      hasUser: !!user, 
      hasSession: !!session, 
      userEmail: user?.email,
      notificationPermission,
      currentSessionId: session?.access_token?.slice(-10),
      lastSessionId: sessionIdRef.current?.slice(-10),
      currentUserId: user?.id?.slice(-10),
      lastUserId: userIdRef.current?.slice(-10),
      alreadySent: notificationSentRef.current,
      timeSinceLastNotification: Date.now() - lastNotificationTimeRef.current
    });
    
    if (!user || !session) {
      console.log('❌ No user or session, skipping notifications');
      return;
    }

    // Enhanced session tracking - check both session ID and user ID
    const currentSessionId = session.access_token;
    const currentUserId = user.id;
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTimeRef.current;
    const minTimeBetweenNotifications = 30 * 60 * 1000; // 30 minutes - increased to reduce redundancy

    // Check if this is the same session and user, and we've recently sent notifications
    if (sessionIdRef.current === currentSessionId && 
        userIdRef.current === currentUserId &&
        notificationSentRef.current &&
        timeSinceLastNotification < minTimeBetweenNotifications) {
      console.log('🔄 Same session and user, notifications recently sent - skipping');
      console.log(`⏱️ Time since last notification: ${Math.round(timeSinceLastNotification / 1000)}s (minimum: ${minTimeBetweenNotifications / 1000}s)`);
      return;
    }

    // Update session tracking
    sessionIdRef.current = currentSessionId;
    userIdRef.current = currentUserId;
    notificationSentRef.current = true;
    lastNotificationTimeRef.current = now;

    try {
      // Initialize mobile notification service
      const mobileService = MobileNotificationService.getInstance();
      
      // Request permission if not granted (with mobile optimization)
      let hasPermission = false;
      if (notificationPermission !== 'granted') {
        console.log('🔔 Requesting notification permission...');
        
        // Try mobile service first for better Android compatibility
        hasPermission = await mobileService.requestPermission();
        
        // Fallback to FCM service
        if (!hasPermission) {
          await requestPermission();
          hasPermission = Notification.permission === 'granted';
        }
        
        if (!hasPermission) {
          console.log('❌ Notification permission not granted after request');
          return;
        } else {
          console.log('✅ Notification permission granted');
        }
      } else {
        console.log('✅ Notification permission already granted');
        hasPermission = true;
      }

      // Small delay to ensure UI is settled
      console.log('⏳ Starting 2-second delay before checking deadlines...');
      setTimeout(async () => {
        // Test basic notification first (using mobile service for better compatibility)
        console.log('🧪 Testing basic notification capability...');
        if (hasPermission) {
          try {
            await mobileService.sendMobileNotification({
              title: '🔔 ProjTrack Login Detected',
              body: `Welcome back, ${user.email}! Checking for deadline notifications...`,
              icon: '/logo.svg',
              tag: 'login-test',
              data: { type: 'login_test' }
            });
          } catch (error) {
            console.error('❌ Failed to send test notification:', error);
            // Fallback to basic notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🔔 ProjTrack Login Detected', {
                body: `Welcome back, ${user.email}! Checking for deadline notifications...`,
                icon: '/logo.svg',
                tag: 'login-test'
              });
            }
          }
        }
        
        try {
          // Check for upcoming deadlines and calendar events - comprehensive notification check
          console.log('🔔 Starting comprehensive auto-notification check after login...');
          const { tasks: upcomingTasks, events: upcomingEvents } = await enhancedNotificationService.checkAllUpcomingNotifications();
          console.log('📋 Summary:', upcomingTasks.length, 'tasks,', upcomingEvents.length, 'events');
          
          // Additional individual notifications for better user awareness
          if (upcomingTasks.length > 0) {
            console.log('📱 Sending individual task notifications for better awareness...');
            upcomingTasks.forEach((task: unknown, index: number) => {
              const typedTask = task as Record<string, unknown>;
              setTimeout(async () => {
                console.log(`📱 Sending individual task notification: ${typedTask.title}`);
                
                try {
                  // Use mobile service for better cross-platform compatibility
                  const success = await mobileService.sendMobileNotification({
                    title: String(typedTask.project_name),
                    body: `${typedTask.title}\n${typedTask.status}, ${typedTask.priority} priority\n${new Date(String(typedTask.end_date)).toLocaleDateString()}\n${typedTask.daysRemaining === 0 ? '🚨 DUE TODAY' : typedTask.daysRemaining === 1 ? '⚠️ 1 day' : '⏰ ' + typedTask.daysRemaining + ' days'}`,
                    icon: '/logo.svg',
                    badge: '/logo.svg',
                    tag: `task-${typedTask.id}`,
                    requireInteraction: Number(typedTask.daysRemaining) <= 1,
                    vibrate: Number(typedTask.daysRemaining) <= 1 ? [200, 100, 200] : [100],
                    data: {
                      taskId: String(typedTask.id),
                      projectName: String(typedTask.project_name),
                      daysRemaining: String(typedTask.daysRemaining),
                      type: 'task_deadline'
                    }
                  });
                  
                  if (!success) {
                    console.warn('📱 Mobile notification failed, falling back to basic notification');
                    // Fallback to basic notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                      const dueDate = new Date(String(typedTask.end_date)).toLocaleDateString();
                      const urgencyIcon = Number(typedTask.daysRemaining) === 0 ? '🚨' : 
                                        Number(typedTask.daysRemaining) <= 1 ? '⚠️' : '⏰';
                      
                      const title = String(typedTask.project_name);
                      const body = `${typedTask.title}\n${typedTask.status}, ${typedTask.priority} priority\n${dueDate}\n${urgencyIcon} ${Number(typedTask.daysRemaining) === 0 ? 'DUE TODAY' : Number(typedTask.daysRemaining) === 1 ? '1 day' : typedTask.daysRemaining + ' days'}`;
                      
                      new Notification(title, {
                        body: body,
                        icon: '/logo.svg',
                        badge: '/logo.svg',
                        tag: `task-${typedTask.id}`,
                        requireInteraction: Number(typedTask.daysRemaining) <= 1
                      });
                    }
                  }
                } catch (notificationError) {
                  console.error('❌ Error sending task notification:', notificationError);
                }
                
                // Show toast notification as well
                const urgencyIcon = Number(typedTask.daysRemaining) === 0 ? '🚨' : 
                                  Number(typedTask.daysRemaining) <= 1 ? '⚠️' : '⏰';
                toast.error(`${urgencyIcon} ${typedTask.project_name}: ${typedTask.title} - ${Number(typedTask.daysRemaining) === 0 ? 'Due today!' : Number(typedTask.daysRemaining) === 1 ? 'Due tomorrow!' : typedTask.daysRemaining + ' days left'}`, {
                  duration: 1000,
                });
              }, index * 2000); // Stagger notifications by 2 seconds
            });

            console.log(`🔔 Auto-notification completed for ${user.email}: ${upcomingTasks.length} individual task notifications sent`);
          } else {
            // No deadlines - show friendly welcome
            console.log('✅ No upcoming deadlines found - showing welcome message');
            toast.success(`👋 Welcome back! All tasks are on track.`, {
              duration: 1000,
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

  // Reset notification tracking when user changes
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      console.log('👤 User changed, resetting notification tracking');
      notificationSentRef.current = false;
      sessionIdRef.current = null;
      userIdRef.current = user?.id || null;
      lastNotificationTimeRef.current = 0;
    }
  }, [user?.id]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session]); // Intentionally excluding triggerLoginNotifications to prevent excessive re-renders

  return {
    triggerLoginNotifications
  };
};
