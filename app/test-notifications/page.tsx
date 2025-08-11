"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestNotificationService } from '@/lib/test-notification-service';
import { mobileNotificationService } from '@/lib/mobile-notification-service';
import { Bell, TestTube, Clock, AlertTriangle, Smartphone, CheckCircle, X, Wifi, WifiOff } from 'lucide-react';

interface MobileCompatibility {
  isMobile: boolean;
  isChrome: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  supportsPush: boolean;
  supportsServiceWorker: boolean;
  isSecure: boolean;
  notificationPermission: string;
  issues: string[];
  recommendations: string[];
}

export default function NotificationTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTest, setLastTest] = useState<string | null>(null);
  const [compatibility, setCompatibility] = useState<MobileCompatibility | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkMobileCompatibility();
    
    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkMobileCompatibility = () => {
    // Get browser info from mobile notification service
    const browserInfo = mobileNotificationService.getBrowserInfo();
    const supportStatus = mobileNotificationService.getSupportStatus();
    
    setCompatibility({
      isMobile: browserInfo.isMobile,
      isChrome: browserInfo.isChrome,
      isIOS: browserInfo.isIOS,
      isAndroid: browserInfo.isAndroid,
      supportsPush: browserInfo.supportsPush,
      supportsServiceWorker: browserInfo.supportsServiceWorker,
      isSecure: browserInfo.isSecure,
      notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported',
      issues: supportStatus.issues,
      recommendations: supportStatus.recommendations
    });
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await mobileNotificationService.requestPermission();
      if (granted) {
        addTestResult('✅ Mobile notification permission granted!');
        checkMobileCompatibility(); // Refresh compatibility check
      } else {
        addTestResult('❌ Mobile notification permission denied or dismissed');
      }
    } catch (error) {
      addTestResult(`❌ Permission request failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testMobileNotification = async () => {
    setIsLoading(true);
    try {
      addTestResult('📱 Testing mobile notification system...');
      
      // Check mobile compatibility first
      const browserInfo = mobileNotificationService.getBrowserInfo();
      
      if (!browserInfo.isSecure) {
        addTestResult('❌ HTTPS required for mobile notifications');
        addTestResult('💡 Make sure you\'re accessing via HTTPS or localhost');
        return;
      }
      
      if (!browserInfo.supportsNotifications) {
        addTestResult('❌ Notifications not supported in this browser');
        return;
      }
      
      const success = await mobileNotificationService.testMobileNotification();
      if (success) {
        addTestResult('✅ Mobile notification sent successfully!');
        addTestResult('📱 Check your device for the notification');
      } else {
        addTestResult('❌ Mobile notification failed to send');
        addTestResult('💡 Try enabling notifications in browser settings');
      }
      setLastTest(new Date().toLocaleTimeString());
    } catch (error) {
      addTestResult(`❌ Mobile notification test failed: ${error}`);
      
      // Provide mobile-specific help
      const browserInfo = mobileNotificationService.getBrowserInfo();
      if (browserInfo.isMobile) {
        addTestResult('📱 Mobile Help:');
        addTestResult('1. Tap address bar lock/info icon');
        addTestResult('2. Enable "Notifications"');
        addTestResult('3. Refresh page and try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testTaskDeadlineNotifications = async () => {
    setIsLoading(true);
    try {
      addTestResult('📋 Testing task deadline notifications...');
      const tasks = await mobileNotificationService.checkAndNotifyDeadlines();
      if (tasks.length > 0) {
        addTestResult(`✅ Found and notified ${tasks.length} upcoming deadlines!`);
        tasks.forEach(task => {
          addTestResult(`📌 ${task.project_name}: ${task.title} (${task.daysRemaining} days)`);
        });
      } else {
        addTestResult('✅ No upcoming deadlines found');
      }
      setLastTest(new Date().toLocaleTimeString());
    } catch (error) {
      addTestResult(`❌ Task deadline test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLegacyNotifications = async () => {
    setIsLoading(true);
    try {
      await TestNotificationService.sendSingleTestNotification();
      addTestResult('✅ Legacy notification system test completed');
      setLastTest(new Date().toLocaleTimeString());
    } catch (error) {
      addTestResult(`❌ Legacy test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!compatibility) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading mobile compatibility check...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Smartphone className="h-6 w-6" />
            Enhanced Mobile Notification Test Lab
          </h1>
          <p className="text-gray-600 mt-2">
            Cross-browser mobile notification testing for Android & iPhone Chrome
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {isOnline ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600 text-sm">Online - Ready for Testing</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-600 text-sm">Offline - Limited Functionality</span>
              </>
            )}
          </div>
        </div>

        {/* Mobile Instructions Card */}
        {compatibility.isMobile && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Smartphone className="h-5 w-5" />
                📱 Mobile Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <div className="space-y-2 text-sm">
                <p className="font-medium">To enable notifications on your mobile device:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Tap the 🔒 lock icon or ℹ️ info icon in your browser address bar</li>
                  <li>Find &quot;Notifications&quot; and set it to &quot;Allow&quot;</li>
                  <li>Refresh this page and test again</li>
                </ol>
                <p className="mt-3 text-xs bg-blue-100 p-2 rounded">
                  <strong>Chrome Mobile:</strong> Settings → Site Settings → Notifications → Allow<br/>
                  <strong>Safari iOS:</strong> Limited support - Use Chrome for best experience
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Mobile Compatibility Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Enhanced Mobile Browser Analysis
            </CardTitle>
            <CardDescription>
              Comprehensive mobile notification compatibility check
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant={compatibility.isMobile ? "default" : "secondary"}>
                  {compatibility.isMobile ? "📱 Mobile Device" : "💻 Desktop"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={compatibility.isChrome ? "default" : "destructive"}>
                  {compatibility.isChrome ? "✅ Chrome" : "❌ Not Chrome"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={compatibility.isSecure ? "default" : "destructive"}>
                  {compatibility.isSecure ? "🔒 HTTPS" : "❌ Not Secure"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={compatibility.notificationPermission === 'granted' ? "default" : "destructive"}>
                  📢 {compatibility.notificationPermission}
                </Badge>
              </div>
            </div>

            {compatibility.recommendations && compatibility.recommendations.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Recommendations:
                </h4>
                <ul className="mt-2 text-sm text-blue-700">
                  {compatibility.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {compatibility.issues.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Issues Found:
                </h4>
                <ul className="mt-2 text-sm text-red-700">
                  {compatibility.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Mobile Notification Tests
            </CardTitle>
            <CardDescription>
              Test different types of notifications on your mobile device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button 
                onClick={requestNotificationPermission}
                disabled={compatibility.notificationPermission === 'granted' || isLoading}
                className="w-full"
                size="lg"
              >
                <Bell className="h-4 w-4 mr-2" />
                {compatibility.notificationPermission === 'granted' ? 'Permission Granted ✅' : 'Request Notification Permission'}
              </Button>

              <Button 
                onClick={testMobileNotification}
                disabled={compatibility.notificationPermission !== 'granted' || isLoading || !isOnline}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Testing...' : '� Test Enhanced Mobile Notification'}
              </Button>

              <Button 
                onClick={testTaskDeadlineNotifications}
                disabled={compatibility.notificationPermission !== 'granted' || isLoading || !isOnline}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Testing...' : '📋 Test Task Deadline Notifications'}
              </Button>

              <Button 
                onClick={testLegacyNotifications}
                disabled={compatibility.notificationPermission !== 'granted' || isLoading || !isOnline}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Testing...' : '� Test Legacy System (Fallback)'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expected Format */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">📋 Expected Notification Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-800 mb-2">Your Requested Format:</h4>
              <div className="text-sm text-green-700 font-mono bg-white p-3 rounded border">
                <div className="font-bold">Cebu Industrial Park Power Systems</div>
                <div className="mt-1">dsafasgs</div>
                <div className="mt-1">in-progress, high priority</div>
                <div className="mt-1">8/12/2025</div>
                <div className="mt-1">⏰ 3 days</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Test Results
              </span>
              <Button onClick={clearResults} size="sm" variant="outline" disabled={isLoading}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No test results yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
            
            {lastTest && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <Badge variant="default">Last test: {lastTest}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile-Specific Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">📱 Mobile Chrome Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                <h4 className="font-semibold">If notifications don&apos;t work on mobile Chrome:</h4>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li><strong>Chrome Settings:</strong> ⋮ Menu → Settings → Site settings → Notifications → Allow</li>
                  <li><strong>Site Permissions:</strong> Tap 🔒 in address bar → Permissions → Notifications → Allow</li>
                  <li><strong>Android Settings:</strong> Settings → Apps → Chrome → Notifications → Enable all</li>
                  <li><strong>Battery Optimization:</strong> Settings → Battery → Battery optimization → Chrome → Don&apos;t optimize</li>
                  <li><strong>Do Not Disturb:</strong> Turn off DND mode temporarily</li>
                </ol>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-semibold">For iOS Safari:</h4>
                <p>iOS Safari has very limited notification support. For better results:</p>
                <ul className="mt-1 list-disc list-inside">
                  <li>Use Chrome on iOS instead</li>
                  <li>Add site to home screen as PWA</li>
                  <li>Enable notifications in iOS Settings → Safari → Notifications</li>
                </ul>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                <h4 className="font-semibold">Testing Tips:</h4>
                <ul className="mt-1 list-disc list-inside">
                  <li>Keep the browser tab active during testing</li>
                  <li>Test with screen unlocked first</li>
                  <li>Check notification history if missed</li>
                  <li>Try different vibration patterns for urgent tasks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
