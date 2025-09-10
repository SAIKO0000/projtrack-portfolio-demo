import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload, Messaging } from 'firebase/messaging';

// Firebase configuration for portfolio demo
const firebaseConfig = {
  apiKey: "AIzaSyDQuH68r81F1gwmK3VJs2BODKXdmRG-Zbs",
  authDomain: "proj-tracker-demo.firebaseapp.com",
  projectId: "proj-tracker-demo",
  storageBucket: "proj-tracker-demo.firebasestorage.app",
  messagingSenderId: "422442704375",
  appId: "1:422442704375:web:cf181ddb53547acc3aa2f2"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging only on client side
let messaging: Messaging | null = null;

const initializeMessaging = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
    try {
      messaging = getMessaging(app);
      return messaging;
    } catch (error) {
      console.warn('Failed to initialize Firebase messaging:', error);
      return null;
    }
  }
  return null;
};

export { messaging, initializeMessaging };

// VAPID key
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "ynvijyy0720f5RRqx4BuU55VbfAbPmx8qi19jykKE8c";

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Check if we're in a browser environment with required APIs
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Browser does not support notifications or service workers');
      return null;
    }

    // Initialize messaging
    const currentMessaging = initializeMessaging();
    if (!currentMessaging) {
      console.warn('Failed to initialize Firebase messaging');
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      const token = await getToken(currentMessaging, {
        vapidKey: VAPID_KEY,
      });
      
      if (token) {
        console.log('FCM Token:', token);
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      const currentMessaging = initializeMessaging();
      if (currentMessaging) {
        onMessage(currentMessaging, (payload: MessagePayload) => {
          console.log('Message received. ', payload);
          resolve(payload);
        });
      } else {
        resolve(null);
      }
    } else {
      resolve(null);
    }
  });
