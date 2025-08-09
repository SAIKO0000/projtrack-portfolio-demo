import { useState, useEffect } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { FCMDebugger } from '@/lib/fcm-debugger';

interface FCMHook {
  token: string | null;
  notificationPermission: NotificationPermission | null;
  requestPermission: () => Promise<void>;
  isLoading: boolean;
  isSupported: boolean;
}

export const useFCM = (): FCMHook => {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check browser support first
    const browserSupported = FCMDebugger.checkBrowserSupport();
    setIsSupported(browserSupported);

    if (!browserSupported) {
      console.log('⚠️ FCM not supported in this browser');
      return;
    }

    // Check initial permission status
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Listen for foreground messages only if supported
      onMessageListener()
        .then((payload) => {
          if (payload) {
            console.log('Received foreground message:', payload);
            // Handle foreground notification here
            // You can show a toast or update the UI
          }
        })
        .catch((err) => console.log('Failed to receive message:', err));
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      console.log('❌ FCM not supported in this browser');
      return;
    }

    setIsLoading(true);
    
    // Run debug checks
    console.log('🚀 Starting FCM permission request...');
    FCMDebugger.checkBrowserSupport();
    FCMDebugger.checkPermission();
    
    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        setToken(fcmToken);
        setNotificationPermission('granted');
        
        // Log token info for debugging
        FCMDebugger.logTokenInfo(fcmToken);
        
        // Send token to your backend to store it
        try {
          const response = await fetch('/api/fcm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: fcmToken,
              userId: 'current-user-id', // TODO: Get actual user ID from auth context
            }),
          });

          const result = await response.json();
          if (result.success) {
            console.log('✅ FCM Token sent to server successfully');
          } else {
            console.error('❌ Failed to send FCM token to server:', result.error);
          }
        } catch (apiError) {
          console.error('❌ Error sending FCM token to server:', apiError);
        }
        
        console.log('✅ FCM setup completed successfully');
      } else {
        setNotificationPermission('denied');
        console.log('❌ FCM token not obtained');
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      setNotificationPermission('denied');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    token,
    notificationPermission,
    requestPermission,
    isLoading,
    isSupported,
  };
};
