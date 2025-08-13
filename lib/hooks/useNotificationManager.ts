import { useState, useEffect, useCallback } from 'react';
import { useDeadlineNotifications } from './useDeadlineNotifications';

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

interface UseNotificationManager {
  // Popup state
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  
  // Notification data
  upcomingTasks: TaskDeadline[];
  isLoading: boolean;
  
  // Actions
  checkDeadlines: () => Promise<void>;
  dismissPopup: () => void;
  handleTaskClick: (taskId: string) => void;
  handleLogout: () => void;
  
  // Mobile compatibility
  isMobileCompatible: boolean;
  requestMobilePermission: () => Promise<boolean>;
}

export const useNotificationManager = (): UseNotificationManager => {
  const [showPopup, setShowPopup] = useState(false);
  const [isMobileCompatible, setIsMobileCompatible] = useState(false);
  
  const { upcomingTasks, isLoading, checkDeadlines } = useDeadlineNotifications();

  // Check mobile compatibility
  useEffect(() => {
    const checkMobileCompatibility = () => {
      if (typeof window === 'undefined') return false;
      
      const userAgent = navigator.userAgent.toLowerCase();
      const isAndroid = /android/i.test(userAgent);
      const isIOS = /iphone|ipad|ipod/i.test(userAgent);
      const isChrome = /chrome/i.test(userAgent) && !/edg/i.test(userAgent);
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      const supportsNotifications = 'Notification' in window;
      
      const compatible = supportsNotifications && isSecure && (
        (isAndroid && isChrome) || // Android Chrome
        isIOS || // iOS Safari/Chrome
        (!isAndroid && !isIOS) // Desktop browsers
      );
      
      console.log('📱 Mobile compatibility check:', {
        isAndroid,
        isIOS,
        isChrome,
        isSecure,
        supportsNotifications,
        compatible
      });
      
      setIsMobileCompatible(compatible);
      return compatible;
    };
    
    checkMobileCompatibility();
  }, []);

  // Show popup on login (not on refresh) - triggered only once per session
  useEffect(() => {
    if (upcomingTasks.length > 0) {
      // Check if this is a fresh login (not a page refresh)
      const isNewSession = !sessionStorage.getItem('notificationShownThisSession');
      const lastLoginDismiss = localStorage.getItem('notificationDismissedOnLogout');
      
      if (isNewSession || lastLoginDismiss === 'true') {
        console.log(`📢 Showing notification banner for ${upcomingTasks.length} tasks - Fresh login detected`);
        setShowPopup(true);
        
        // Mark that notification has been shown this session
        sessionStorage.setItem('notificationShownThisSession', 'true');
        
        // Clear the logout dismissal flag
        localStorage.removeItem('notificationDismissedOnLogout');
      } else {
        console.log(`⏭️ Notification skipped - Already shown this session`);
      }
    }
  }, [upcomingTasks.length]);

  const dismissPopup = useCallback(() => {
    setShowPopup(false);
    console.log('🔕 Notification dismissed by user');
  }, []);

  // Add logout handler to prepare for next login notification
  const handleLogout = useCallback(() => {
    // Mark that user logged out, so notification shows on next login
    localStorage.setItem('notificationDismissedOnLogout', 'true');
    sessionStorage.removeItem('notificationShownThisSession');
    console.log('👋 User logged out - Next login will show notifications');
  }, []);

  const handleTaskClick = useCallback((taskId: string) => {
    console.log('📱 Task clicked from notification:', taskId);
    
    // Close the popup
    dismissPopup();
    
    // Navigate to task (this would be handled by the parent component)
    // For now, just log the action
    console.log('Navigate to task:', taskId);
    
    // You could emit a custom event or use a callback prop here
    window.dispatchEvent(new CustomEvent('notification-task-click', { 
      detail: { taskId } 
    }));
  }, [dismissPopup]);

  const requestMobilePermission = useCallback(async (): Promise<boolean> => {
    try {
      // Simplified permission request - no automatic services
      if (!('Notification' in window)) {
        console.log('❌ Notifications not supported in this browser');
        return false;
      }

      if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('❌ Notification permission denied');
        return false;
      }

      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      console.log(`📱 Permission result: ${permission} (granted: ${granted})`);
      return granted;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }, []);

  return {
    showPopup,
    setShowPopup,
    upcomingTasks,
    isLoading,
    checkDeadlines,
    dismissPopup,
    handleTaskClick,
    handleLogout,
    isMobileCompatible,
    requestMobilePermission
  };
};
