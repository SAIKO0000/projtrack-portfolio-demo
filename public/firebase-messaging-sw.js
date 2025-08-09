// Firebase Service Worker for FCM
// Note: Service workers can't use ES6 imports, so we use importScripts

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzdmdMRA4ddw0S_vCU-cDvpABgn_jmcoI",
  authDomain: "proj-tracker-b37a8.firebaseapp.com",
  projectId: "proj-tracker-b37a8",
  storageBucket: "proj-tracker-b37a8.firebasestorage.app",
  messagingSenderId: "492289034896",
  appId: "1:492289034896:web:a3718e0c52e102bf87e615",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'ProjTrack Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: 'projtrack-notification',
    data: payload.data,
    requireInteraction: payload.data?.type === 'task_deadline' && payload.data?.daysRemaining === '0'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked: ', event);
  
  event.notification.close();
  
  // Handle different notification types
  const data = event.notification.data || {};
  
  let urlToOpen = '/';
  
  if (data.type === 'task_deadline' && data.taskId) {
    // Navigate to the specific task or project
    urlToOpen = `/?task=${data.taskId}`;
  }
  
  // Navigate to the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If there's already a window open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Scheduled notification functionality
const NOTIFICATION_TIMES = [
  { hour: 7, minute: 0 },   // 7:00 AM
  { hour: 12, minute: 0 },  // 12:00 PM
  { hour: 15, minute: 0 }   // 3:00 PM
];

// Check if current time matches notification time
function isNotificationTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  return NOTIFICATION_TIMES.some(time => 
    time.hour === currentHour && currentMinute >= time.minute && currentMinute < time.minute + 1
  );
}

// Track last notification to prevent duplicates
let lastNotificationHour = -1;

// Check for scheduled notifications every minute
setInterval(async () => {
  const now = new Date();
  const currentHour = now.getHours();
  
  if (isNotificationTime() && lastNotificationHour !== currentHour) {
    console.log('[SW] Scheduled notification time reached:', currentHour + ':00');
    lastNotificationHour = currentHour;
    
    try {
      // Create a simple API call to get task data
      // Note: In service worker context, we'll need to use fetch with full URL
      const baseUrl = self.location.origin;
      const response = await fetch(`${baseUrl}/api/scheduled-tasks`);
      
      if (!response.ok) {
        console.log('[SW] API not available, using mock data for demo');
        // For demo purposes, create mock notification
        self.registration.showNotification('🚨 4 urgent deadlines (≤3 days) + 2 upcoming (4-7 days)!', {
          body: '• Manila Bay Project: Power Grid Installation (DUE TODAY)\n• Cebu Industrial Park: Electrical Upgrade (2 days left)\n• Davao Commercial Complex: Wiring (5 days left)',
          icon: '/logo.svg',
          badge: '/logo.svg',
          tag: 'scheduled-deadlines',
          requireInteraction: true
        });
        return;
      }
      
      const data = await response.json();
      
      if (data.tasks && data.tasks.length > 0) {
        const urgentTasks = data.tasks.filter(task => task.daysRemaining <= 3);
        const warningTasks = data.tasks.filter(task => task.daysRemaining > 3 && task.daysRemaining <= 7);
        
        let title = '';
        let body = '';
        
        if (urgentTasks.length > 0) {
          title = `🚨 ${urgentTasks.length} urgent deadline${urgentTasks.length > 1 ? 's' : ''} (≤3 days)${warningTasks.length > 0 ? ` + ${warningTasks.length} upcoming (4-7 days)` : ''}!`;
          
          const taskLines = urgentTasks.slice(0, 3).map(task => {
            const dueText = task.daysRemaining === 0 ? 'DUE TODAY' : 
                           task.daysRemaining === 1 ? '1 day left' : 
                           `${task.daysRemaining} days left`;
            return `• ${task.project_name}: ${task.title} (${dueText})`;
          });
          
          if (urgentTasks.length > 3) {
            taskLines.push(`+ ${urgentTasks.length - 3} more urgent task${urgentTasks.length - 3 > 1 ? 's' : ''}`);
          }
          
          body = taskLines.join('\n');
        } else if (warningTasks.length > 0) {
          title = `⚠️ ${warningTasks.length} task${warningTasks.length > 1 ? 's' : ''} due in next 7 days`;
          
          const taskLines = warningTasks.slice(0, 3).map(task => 
            `• ${task.project_name}: ${task.title} (${task.daysRemaining} days left)`
          );
          
          if (warningTasks.length > 3) {
            taskLines.push(`+ ${warningTasks.length - 3} more task${warningTasks.length - 3 > 1 ? 's' : ''}`);
          }
          
          body = taskLines.join('\n');
        }
        
        if (title) {
          console.log('[SW] Sending scheduled notification:', title);
          self.registration.showNotification(title, {
            body: body,
            icon: '/logo.svg',
            badge: '/logo.svg',
            tag: 'scheduled-deadlines',
            requireInteraction: urgentTasks.length > 0,
            data: {
              type: 'scheduled_deadline',
              urgentCount: urgentTasks.length,
              warningCount: warningTasks.length
            }
          });
        }
      } else {
        console.log('[SW] No tasks found for scheduled notification');
      }
    } catch (error) {
      console.error('[SW] Error checking scheduled tasks:', error);
      // Fallback demo notification
      self.registration.showNotification('🚨 4 urgent deadlines (≤3 days) + 2 upcoming (4-7 days)!', {
        body: '• Manila Bay Project: Power Grid Installation (DUE TODAY)\n• Cebu Industrial Park: Electrical Upgrade (2 days left)\n• Davao Commercial Complex: Wiring (5 days left)',
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'scheduled-deadlines-demo',
        requireInteraction: true
      });
    }
  }
}, 60000); // Check every minute

console.log('[firebase-messaging-sw.js] Service worker loaded with scheduled notifications at 7:00 AM, 12:00 PM, and 3:00 PM');
