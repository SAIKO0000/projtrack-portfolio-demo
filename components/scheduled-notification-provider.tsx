"use client"

import { useScheduledNotifications } from "@/lib/hooks/useScheduledNotifications";

/**
 * Provider component that enables scheduled notifications globally
 * Runs independently of user authentication state
 * Notifications trigger at 7:00 AM, 12:00 PM, and 3:00 PM
 */
export function ScheduledNotificationProvider() {
  // This hook starts the scheduled notification service
  useScheduledNotifications();

  // This component doesn't render anything, it just enables the service
  return null;
}
