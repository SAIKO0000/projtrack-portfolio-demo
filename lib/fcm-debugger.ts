// FCM Debug Utilities
export const FCMDebugger = {
  // Check if browser supports notifications
  checkBrowserSupport: () => {
    console.log('🔍 Checking browser support for FCM...');
    
    if (typeof window === 'undefined') {
      console.log('❌ Running on server side - skipping browser checks');
      return false;
    }

    const checks = {
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      https: location.protocol === 'https:' || location.hostname === 'localhost'
    };

    console.log('Browser Feature Support:');
    console.log('   - Notifications API:', checks.notifications ? '✅' : '❌');
    console.log('   - Service Worker:', checks.serviceWorker ? '✅' : '❌');
    console.log('   - Push Manager:', checks.pushManager ? '✅' : '❌');
    console.log('   - HTTPS/Localhost:', checks.https ? '✅' : '❌');

    const isSupported = Object.values(checks).every(Boolean);
    
    if (!isSupported) {
      console.warn('❌ Browser missing required FCM features');
      
      if (!checks.https) {
        console.warn('⚠️ FCM requires HTTPS or localhost. Current protocol:', location.protocol);
      }
      if (!checks.notifications) {
        console.warn('⚠️ Notifications API not supported');
      }
      if (!checks.serviceWorker) {
        console.warn('⚠️ Service Workers not supported');
      }
      if (!checks.pushManager) {
        console.warn('⚠️ Push Manager not supported');
      }
      
      return false;
    }
    
    console.log('✅ Browser fully supports FCM');
    return true;
  },

  // Check current notification permission
  checkPermission: () => {
    if (typeof window === 'undefined') return null;
    
    const permission = Notification.permission;
    console.log('🔍 Current notification permission:', permission);
    
    switch (permission) {
      case 'granted':
        console.log('✅ Notifications are allowed');
        break;
      case 'denied':
        console.log('❌ Notifications are blocked');
        break;
      case 'default':
        console.log('⚠️ Notification permission not yet requested');
        break;
    }
    
    return permission;
  },

  // Check service worker registration
  checkServiceWorker: async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('❌ Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      
      if (registration) {
        console.log('✅ Service Worker is registered:', registration);
        console.log('   - Scope:', registration.scope);
        console.log('   - State:', registration.active?.state);
        return true;
      } else {
        console.log('⚠️ Service Worker not found, attempting to register...');
        
        const newRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service Worker registered successfully:', newRegistration);
        return true;
      }
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  },

  // Test notification display
  testNotification: () => {
    if (typeof window === 'undefined') return;
    
    if (Notification.permission === 'granted') {
      console.log('🧪 Testing notification display...');
      
      const notification = new Notification('ProjTrack Test', {
        body: 'This is a test notification from ProjTrack',
        icon: '/logo.svg',
        tag: 'test-notification'
      });

      notification.onclick = () => {
        console.log('✅ Test notification clicked');
        notification.close();
      };

      setTimeout(() => {
        notification.close();
        console.log('🧪 Test notification closed automatically');
      }, 5000);
    } else {
      console.log('❌ Cannot test notification - permission not granted');
    }
  },

  // Log FCM token info
  logTokenInfo: (token: string | null) => {
    if (token) {
      console.log('🔑 FCM Token received:');
      console.log('   - Length:', token.length);
      console.log('   - Preview:', token.substring(0, 20) + '...');
      console.log('   - Full token:', token);
    } else {
      console.log('❌ No FCM token available');
    }
  },

  // Log Firebase config
  logFirebaseConfig: () => {
    console.log('🔧 Firebase Configuration:');
    console.log('   - Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set');
    console.log('   - Sender ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'Not set');
    console.log('   - VAPID Key:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? 'Set' : 'Not set');
  },

  // Run all checks
  runAllChecks: async () => {
    console.log('🚀 Starting FCM Debug Checks...');
    console.log('=====================================');
    
    FCMDebugger.logFirebaseConfig();
    console.log('');
    
    const browserSupport = FCMDebugger.checkBrowserSupport();
    console.log('');
    
    if (browserSupport) {
      FCMDebugger.checkPermission();
      console.log('');
      
      await FCMDebugger.checkServiceWorker();
      console.log('');
    }
    
    console.log('=====================================');
    console.log('🏁 FCM Debug Checks Complete');
  },

  // Create test deadline notifications
  createTestDeadlineNotification: () => {
    if (typeof window === 'undefined') {
      console.log('❌ Not in browser environment');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.log('❌ Notifications not granted. Please enable notifications first.');
      return;
    }

    console.log('🧪 Creating test deadline notification...');

    const testTask = {
      id: 'test-task-' + Date.now(),
      title: 'Test Task - Check Notification System',
      project_name: 'Test Project',
      end_date: new Date().toISOString(),
      status: 'in progress',
      priority: 'high',
      assigned_to: null,
      daysRemaining: 1
    };

    const notification = new Notification('⚠️ Task Deadline Alert', {
      body: `Test Project\nTest Task - Check Notification System\n1 day remaining • in progress • high priority`,
      icon: '/logo.svg',
      badge: '/logo.svg',
      tag: 'test-deadline-notification',
      requireInteraction: false,
      data: {
        taskId: testTask.id,
        projectName: testTask.project_name,
        daysRemaining: '1',
        type: 'test_deadline'
      }
    });

    notification.onclick = () => {
      console.log('✅ Test notification clicked!');
      notification.close();
    };

    notification.onshow = () => {
      console.log('✅ Test notification displayed successfully!');
    };

    notification.onerror = (error) => {
      console.error('❌ Test notification error:', error);
    };

    setTimeout(() => {
      notification.close();
      console.log('🔐 Test notification auto-closed');
    }, 5000);
  },

  // Check deadline service manually
  checkDeadlineService: async () => {
    console.log('🔍 Testing deadline notification service...');
    
    try {
      // Import the service dynamically to avoid SSR issues
      const { DeadlineNotificationService } = await import('@/lib/deadline-notification-service');
      
      console.log('📅 Checking task deadlines...');
      const upcomingTasks = await DeadlineNotificationService.checkTaskDeadlines();
      
      console.log(`📊 Found ${upcomingTasks.length} tasks with upcoming deadlines:`);
      upcomingTasks.forEach(task => {
        console.log(`  • ${task.project_name}: ${task.title} (${task.daysRemaining} days remaining)`);
      });
      
      if (upcomingTasks.length > 0) {
        console.log('🧪 Testing notification for first task...');
        await DeadlineNotificationService.sendBrowserNotification(upcomingTasks[0]);
      } else {
        console.log('ℹ️ No upcoming deadlines to test with');
      }
      
      return upcomingTasks;
    } catch (error) {
      console.error('❌ Error testing deadline service:', error);
      return [];
    }
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as typeof window & { FCMDebugger: typeof FCMDebugger }).FCMDebugger = FCMDebugger;
}
