import { useEffect, useRef } from 'react';
import { ScheduledNotificationService } from '@/lib/scheduled-notification-service';

/**
 * Hook to manage scheduled notifications that run at specific times
 * Notifications appear at 7:00 AM, 12:00 PM, and 3:00 PM
 * Works independently of user login status
 */
export const useScheduledNotifications = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const permissionRequested = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const setupScheduledNotifications = async () => {
      console.log('🔧 Setting up scheduled notifications...');
      
      // Request notification permission once
      if (!permissionRequested.current) {
        permissionRequested.current = true;
        const hasPermission = await ScheduledNotificationService.requestNotificationPermission();
        
        if (!hasPermission) {
          console.log('❌ Cannot setup scheduled notifications - permission denied');
          return;
        }
      }

      // Start the scheduled notification service
      if (!intervalRef.current) {
        intervalRef.current = ScheduledNotificationService.startScheduledNotifications();
        console.log('✅ Scheduled notifications service started');
      }
    };

    setupScheduledNotifications();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🛑 Scheduled notifications service stopped');
      }
    };
  }, []);

  // Manual trigger for testing
  const triggerTestNotification = async () => {
    console.log('🧪 Triggering test notification...');
    await ScheduledNotificationService.sendScheduledNotification();
  };

  return {
    triggerTestNotification
  };
};
