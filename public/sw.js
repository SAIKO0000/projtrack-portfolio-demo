// Enhanced service worker for mobile notifications
// Optimized for Android Chrome and cross-browser compatibility

const CACHE_NAME = 'projtrack-notifications-v1';
const urlsToCache = [
  '/',
  '/logo.svg',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('📱 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📱 Service Worker: Caching resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('📱 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('📱 Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Enhanced notification handling for mobile devices
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event.notification.data);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  notification.close();

  // Handle different notification types
  switch (data.type) {
    case 'task_deadline':
      event.waitUntil(
        clients.openWindow(`/gantt?task=${data.taskId}`)
      );
      break;
    case 'login_test':
      event.waitUntil(
        clients.openWindow('/')
      );
      break;
    default:
      event.waitUntil(
        clients.openWindow('/')
      );
  }
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('📱 Notification closed:', event.notification.data);
  
  // Track notification dismissal analytics if needed
  const data = event.notification.data || {};
  if (data.type === 'task_deadline' && data.daysRemaining <= 1) {
    console.log('⚠️ Urgent notification dismissed:', data.taskId);
  }
});

// Background sync for offline notification queue
self.addEventListener('sync', (event) => {
  console.log('📱 Background sync triggered:', event.tag);
  
  if (event.tag === 'deadline-notifications') {
    event.waitUntil(processQueuedNotifications());
  }
});

// Process queued notifications when back online
async function processQueuedNotifications() {
  try {
    console.log('📱 Processing queued notifications...');
    
    // Get queued notifications from IndexedDB or localStorage
    const queuedNotifications = await getQueuedNotifications();
    
    for (const notification of queuedNotifications) {
      await self.registration.showNotification(notification.title, notification.options);
      console.log('📱 Queued notification sent:', notification.title);
    }
    
    // Clear the queue
    await clearNotificationQueue();
    
  } catch (error) {
    console.error('❌ Error processing queued notifications:', error);
  }
}

// Helper functions for notification queue management
async function getQueuedNotifications() {
  // Simple implementation using postMessage to get data from main thread
  // In a full implementation, you'd use IndexedDB
  return [];
}

async function clearNotificationQueue() {
  // Clear the notification queue
  return Promise.resolve();
}

// Fetch event for caching (basic implementation)
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback for offline scenarios
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Push event handling (for future FCM integration)
self.addEventListener('push', (event) => {
  console.log('📱 Push message received:', event.data);
  
  if (!event.data) {
    console.log('📱 Push message had no payload');
    return;
  }

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/logo.svg',
      badge: data.badge || '/logo.svg',
      tag: data.tag || 'general',
      requireInteraction: data.requireInteraction || false,
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ProjTrack', options)
    );
    
  } catch (error) {
    console.error('❌ Error parsing push message:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('ProjTrack', {
        body: 'You have a new notification',
        icon: '/logo.svg',
        badge: '/logo.svg'
      })
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('📱 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker script loaded successfully');
