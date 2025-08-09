# Debugging Auto-Notifications

## Issues to Check:

### 1. **Database Tasks with Upcoming Deadlines**
- Check if there are tasks with end_date within 7 days
- Verify task status is not 'completed'
- Ensure tasks have proper project associations

### 2. **FCM Token Generation**
- Check if FCM token is being generated properly
- Verify notification permissions are granted
- Test browser notification support

### 3. **Auto-Notification Hook Trigger**
- Check if useAutoNotifications is being called on login
- Verify user session and authentication state
- Monitor console logs for debugging info

## Debugging Steps:

1. **Open Browser Console** - Check for auto-notification logs
2. **Login to Application** - Look for these log messages:
   - `🔄 useAutoNotifications effect triggered`
   - `🚀 triggerLoginNotifications called`
   - `🔔 Starting auto-notification check after login...`
   - `📋 Tasks found for notification: X`

3. **Test Notification Permissions**:
   ```javascript
   // Run in browser console
   console.log('Notification permission:', Notification.permission);
   if (Notification.permission === 'granted') {
     new Notification('Test', { body: 'Testing browser notifications' });
   }
   ```

4. **Test Database Query**:
   ```javascript
   // Check deadline service manually
   import { DeadlineNotificationService } from '@/lib/deadline-notification-service';
   DeadlineNotificationService.checkTaskDeadlines().then(tasks => {
     console.log('Manual deadline check:', tasks);
   });
   ```

## Expected Behavior After Login:

1. **Console Logs**:
   - Should see auto-notification debugging messages
   - Should show tasks found (if any exist)
   - Should show notification permission status

2. **Browser Notifications**:
   - Test notification: "ProjTrack Login Detected"
   - Task deadline notifications (if any tasks exist)
   - Summary notification

3. **Toast Messages**:
   - Welcome message or deadline alerts
   - Should appear in top-right of screen

## If No Notifications Appear:

1. **Check Browser Console** for error messages
2. **Verify Notification Permission** is granted
3. **Check Database** for tasks with end_date within 7 days
4. **Test in localhost** (localhost:3000) for better permission handling
5. **Manually test** notification service in browser console

The system is now configured to:
- ✅ Check for deadlines 7 days in advance (instead of 3)
- ✅ Send test notification on every login
- ✅ Provide comprehensive console logging
- ✅ Handle both urgent (≤3 days) and warning (4-7 days) tasks
