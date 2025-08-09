"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestNotificationService } from '@/lib/test-notification-service';
import { Bell, TestTube, Zap, Clock, AlertTriangle, Smartphone, CheckCircle, X } from 'lucide-react';

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
}

export default function NotificationTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTest, setLastTest] = useState<string | null>(null);
  const [compatibility, setCompatibility] = useState<MobileCompatibility | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    checkMobileCompatibility();
  }, []);

  const checkMobileCompatibility = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const issues: string[] = [];
    
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isChrome = /chrome/i.test(userAgent) && !/edg/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    const supportsPush = 'PushManager' in window;
    const supportsServiceWorker = 'serviceWorker' in navigator;
    const notificationPermission = 'Notification' in window ? Notification.permission : 'unsupported';

    // Check for issues
    if (!isSecure) issues.push('Site must be served over HTTPS');
    if (!supportsPush) issues.push('Push Manager not supported');
    if (!supportsServiceWorker) issues.push('Service Worker not supported');
    if (isIOS) issues.push('iOS Safari has limited notification support');
    if (notificationPermission === 'denied') issues.push('Notification permission denied');
    if (isMobile && !isChrome) issues.push('Best support on Chrome mobile');

    setCompatibility({
      isMobile,
      isChrome,
      isIOS,
      isAndroid,
      supportsPush,
      supportsServiceWorker,
      isSecure,
      notificationPermission,
      issues
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
      const permission = await Notification.requestPermission();
      addTestResult(`Permission request result: ${permission}`);
      
      if (permission === 'granted') {
        addTestResult('✅ Notification permission granted!');
        checkMobileCompatibility(); // Refresh compatibility check
      } else {
        addTestResult('❌ Notification permission denied or dismissed');
      }
    } catch (error) {
      addTestResult(`❌ Permission request failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testBasicNotification = () => {
    setIsLoading(true);
    try {
      if (Notification.permission !== 'granted') {
        addTestResult('❌ Cannot test - permission not granted');
        setIsLoading(false);
        return;
      }

      const notification = new Notification('Mobile Test Notification', {
        body: 'This is a basic notification test on mobile device',
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'mobile-test',
        requireInteraction: true,
        vibrate: [200, 100, 200] // Mobile vibration pattern
      });

      notification.onclick = () => {
        addTestResult('✅ Notification clicked!');
        notification.close();
      };

      notification.onshow = () => {
        addTestResult('✅ Basic notification displayed successfully!');
      };

      notification.onerror = (error) => {
        addTestResult(`❌ Notification error: ${error}`);
      };

      setLastTest(new Date().toLocaleTimeString());
    } catch (error) {
      addTestResult(`❌ Basic notification failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTaskNotification = async () => {
    setIsLoading(true);
    try {
      if (Notification.permission !== 'granted') {
        addTestResult('❌ Cannot test - permission not granted');
        setIsLoading(false);
        return;
      }

      // Mock task data in your requested format
      const mockTask = {
        project_name: 'Cebu Industrial Park Power Systems',
        title: 'dsafasgs',
        status: 'in-progress',
        priority: 'high',
        end_date: '8/12/2025',
        days_remaining: 3
      };

      // Format exactly as you requested
      const title = mockTask.project_name;
      const body = `${mockTask.title}\n${mockTask.status}, ${mockTask.priority} priority\n${mockTask.end_date}\n⏰ ${mockTask.days_remaining} days`;

      addTestResult('📱 Sending task notification with your requested format...');
      addTestResult(`Title: "${title}"`);
      addTestResult(`Body: "${body.replace(/\n/g, ' | ')}"`);

      const notification = new Notification(title, {
        body: body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'task-deadline',
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300], // Urgent pattern
        data: {
          taskId: 'test-task-1',
          projectName: mockTask.project_name,
          type: 'deadline'
        }
      });

      notification.onclick = () => {
        addTestResult('✅ Task notification clicked!');
        notification.close();
      };

      notification.onshow = () => {
        addTestResult('✅ Task notification displayed successfully!');
      };

      notification.onerror = (error) => {
        addTestResult(`❌ Task notification error: ${error}`);
      };

      setLastTest(new Date().toLocaleTimeString());
    } catch (error) {
      addTestResult(`❌ Task notification failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testMultipleTaskNotifications = async () => {
    setIsLoading(true);
    try {
      if (Notification.permission !== 'granted') {
        addTestResult('❌ Cannot test - permission not granted');
        setIsLoading(false);
        return;
      }

      const mockTasks = [
        {
          project_name: 'Cebu Industrial Park Power Systems',
          title: 'Power Grid Installation',
          status: 'in-progress',
          priority: 'high',
          end_date: '8/9/2025',
          days_remaining: 0
        },
        {
          project_name: 'Manila Bay Electrical Grid',
          title: 'Electrical Upgrade',
          status: 'in-progress',
          priority: 'high',
          end_date: '8/10/2025',
          days_remaining: 1
        },
        {
          project_name: 'Davao Commercial Complex',
          title: 'Wiring Installation',
          status: 'pending',
          priority: 'medium',
          end_date: '8/12/2025',
          days_remaining: 3
        }
      ];

      addTestResult(`📱 Sending ${mockTasks.length} individual task notifications...`);

      mockTasks.forEach((task, index) => {
        setTimeout(() => {
          const urgencyIcon = task.days_remaining === 0 ? '🚨' : 
                            task.days_remaining <= 1 ? '⚠️' : '⏰';
          
          const daysText = task.days_remaining === 0 ? 'DUE TODAY' : 
                          task.days_remaining === 1 ? '1 day' : 
                          `${task.days_remaining} days`;

          const title = task.project_name;
          const body = `${task.title}\n${task.status}, ${task.priority} priority\n${task.end_date}\n${urgencyIcon} ${daysText}`;
          
          addTestResult(`Sending notification ${index + 1}: ${title}`);
          
          const notification = new Notification(title, {
            body: body,
            icon: '/logo.svg',
            badge: '/logo.svg',
            tag: `task-${index}`,
            requireInteraction: task.days_remaining <= 1,
            vibrate: task.days_remaining <= 1 ? [300, 100, 300, 100, 300] : [200, 100, 200]
          });

          notification.onshow = () => {
            addTestResult(`✅ Notification ${index + 1} displayed`);
          };

          notification.onerror = (error) => {
            addTestResult(`❌ Notification ${index + 1} error: ${error}`);
          };

        }, index * 2500); // Stagger by 2.5 seconds
      });

      setTimeout(() => {
        addTestResult(`✅ All ${mockTasks.length} task notifications scheduled`);
        setLastTest(new Date().toLocaleTimeString());
        setIsLoading(false);
      }, mockTasks.length * 2500 + 1000);

    } catch (error) {
      addTestResult(`❌ Multiple notifications failed: ${error}`);
      setIsLoading(false);
    }
  };

  const testServiceWorkerNotification = async () => {
    setIsLoading(true);
    try {
      if (!('serviceWorker' in navigator)) {
        addTestResult('❌ Service Worker not supported');
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      addTestResult('✅ Service Worker registered');

      await registration.showNotification('Service Worker Test', {
        body: 'This notification was sent via Service Worker for mobile testing',
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'sw-test',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });

      addTestResult('✅ Service Worker notification sent');
      setLastTest(new Date().toLocaleTimeString());

    } catch (error) {
      addTestResult(`❌ Service Worker notification failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAllNotifications = async () => {
    setIsLoading(true);
    try {
      await TestNotificationService.sendTestNotifications();
      setLastTest(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleTest = async () => {
    setIsLoading(true);
    try {
      await TestNotificationService.sendSingleTestNotification();
      setLastTest(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Single test failed:', error);
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
            Mobile Notification Test Lab
          </h1>
          <p className="text-gray-600 mt-2">
            Test individual task deadline notifications on mobile devices
          </p>
        </div>

        {/* Mobile Compatibility Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Mobile Device Status
            </CardTitle>
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
                onClick={testBasicNotification}
                disabled={compatibility.notificationPermission !== 'granted' || isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Testing...' : '🔔 Test Basic Mobile Notification'}
              </Button>

              <Button 
                onClick={testTaskNotification}
                disabled={compatibility.notificationPermission !== 'granted' || isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Testing...' : '📋 Test Single Task Notification'}
              </Button>

              <Button 
                onClick={testMultipleTaskNotifications}
                disabled={compatibility.notificationPermission !== 'granted' || isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Testing...' : '📱 Test Multiple Task Notifications'}
              </Button>

              <Button 
                onClick={testServiceWorkerNotification}
                disabled={compatibility.notificationPermission !== 'granted' || !compatibility.supportsServiceWorker || isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Testing...' : '⚙️ Test Service Worker Notification'}
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
