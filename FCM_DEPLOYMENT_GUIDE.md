# ProjTrack FCM Deployment Guide

## ✅ Environment Variables Added to Vercel
All Firebase environment variables have been added to Vercel production environment.

## 🔧 Firebase Console Configuration Required

### 1. Add Authorized Domain
1. Go to [Firebase Console](https://console.firebase.google.com/project/proj-tracker-b37a8)
2. Go to **Authentication** → **Settings** → **Authorized domains**
3. Add your Vercel domain: `gyg-track.vercel.app`

### 2. Verify Cloud Messaging Setup
1. Go to **Project Settings** → **Cloud Messaging**
2. Ensure VAPID key is: `ynvijyy0720f5RRqx4BuU55VbfAbPmx8qi19jykKE8c`
3. Verify Web Push certificates are configured

### 3. Service Worker Configuration
✅ Updated `firebase-messaging-sw.js` to use `importScripts` (compatible with Vercel)
✅ Added proper notification click handling
✅ Added background message support

## 🚀 Deploy to Production

Run the following command to deploy:

```bash
vercel --prod
```

## 🧪 Testing on Production

After deployment:

1. **Visit**: https://gyg-track.vercel.app
2. **Navigate to**: Notifications page
3. **Enable**: Push notifications (should work on HTTPS)
4. **Test**: Use debug buttons to verify FCM functionality

## 🔍 Debug Commands for Production

Open browser console on your Vercel domain and run:

```js
// Check if FCM is working
FCMDebugger.runAllChecks();

// Test deadline notifications
FCMDebugger.checkDeadlineService();

// Test basic notification
FCMDebugger.createTestDeadlineNotification();

// Check Firebase config
console.log('Firebase Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('VAPID Key available:', !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
```

## 📱 Expected FCM Flow

1. **User enables notifications** → FCM token generated
2. **Backend stores token** → API call to `/api/fcm`
3. **Deadline checker runs** → Every 30 minutes
4. **Notifications sent** → For tasks with 1-3 days remaining
5. **User receives push** → Even when app is closed

## 🚨 Common Issues & Solutions

### Issue: Service Worker fails to register
- ✅ **Fixed**: Updated to use `importScripts` instead of ES6 imports

### Issue: Notifications blocked
- ✅ **Fixed**: HTTPS domain (Vercel) provides secure context

### Issue: No FCM token generated
- Check: Firebase config environment variables
- Check: VAPID key is correctly set
- Check: Domain is authorized in Firebase Console

### Issue: No deadline notifications
- Check: Tasks exist with `end_date` within 3 days
- Check: Database connection is working
- Check: Notification permission is granted

## 📋 Deployment Checklist

- [x] Environment variables added to Vercel
- [x] Service worker updated for production
- [ ] Authorized domain added to Firebase
- [ ] Deploy to production
- [ ] Test FCM on live site
- [ ] Verify deadline notifications work
