"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarRefactored } from "@/components/sidebar/SidebarRefactored"
import { Dashboard } from "@/components/dashboard/dashboard-main"
import { Projects } from "@/components/projects/projects"
import { GanttChartEnhancedRefactored } from "@/components/gantt"
import { Calendar } from "@/components/calendar"
import { TeamRefactored } from "@/components/team"
import { ReportsRefactored } from "@/components/reports/ReportsRefactored"
import { NotificationsRefactored } from "@/components/notifications/NotificationsRefactored"
import { DeadlineNotificationPopup } from "@/components/deadline-notification-popup"
import { useAuth } from "@/lib/auth"
import { useAutoNotifications } from "@/lib/hooks/useAutoNotifications"
import { useNotificationManager } from "@/lib/hooks/useNotificationManager"
import { useDynamicTitle } from "@/lib/hooks/useDynamicTitle"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export default function Home() {
  // Initialize activeTab with default value, then load from localStorage in useEffect
  const [activeTab, setActiveTab] = useState("dashboard")

  // Load saved tab from localStorage after component mounts (client-side only)
  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab')
    if (savedTab) {
      setActiveTab(savedTab)
    }
  }, [])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const router = useRouter()

  // Auto-trigger notifications when user logs in
  useAutoNotifications()

  // Update page title dynamically
  useDynamicTitle(activeTab)

  // Manage notification popup state
  const {
    showPopup,
    upcomingTasks,
    dismissPopup,
    handleTaskClick,
    isMobileCompatible
  } = useNotificationManager()

  // Listen for task navigation events from notifications
  useEffect(() => {
    const handleNotificationTaskClick = (event: CustomEvent) => {
      const { taskId } = event.detail;
      setActiveTab("gantt");
      localStorage.setItem('activeTab', "gantt");
      // You could set selectedProjectId based on the task if needed
      console.log('Navigating to task from notification:', taskId);
    };

    window.addEventListener('notification-task-click', handleNotificationTaskClick as EventListener);
    
    return () => {
      window.removeEventListener('notification-task-click', handleNotificationTaskClick as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setActiveTab("gantt")
    // Save the selected tab to localStorage for persistence
    localStorage.setItem('activeTab', "gantt")
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Save the selected tab to localStorage for persistence
    localStorage.setItem('activeTab', tab)
    // Clear project selection when navigating away from gantt or when going to gantt without project selection
    if (tab !== "gantt") {
      setSelectedProjectId(null)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard key="dashboard" />
      case "projects":
        return <Projects key="projects" onProjectSelect={handleProjectSelect} />
      case "gantt":
        return <GanttChartEnhancedRefactored key="gantt" selectedProjectId={selectedProjectId} />
      case "calendar":
        return <Calendar key="calendar" />
      case "team":
        return <TeamRefactored key="team" />
      case "notifications":
        return <NotificationsRefactored key="notifications" onTabChangeAction={handleTabChange} />
      case "reports":
        return <ReportsRefactored key="reports" onTabChangeAction={handleTabChange} />
      default:
        return <Dashboard key="dashboard-default" />
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarRefactored activeTab={activeTab} onTabChangeAction={handleTabChange} />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pt-20 lg:pt-0">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </main>
      
      {/* Deadline Notification Popup */}
      <DeadlineNotificationPopup
        tasks={upcomingTasks}
        isVisible={showPopup}
        onClose={dismissPopup}
        onTaskClick={handleTaskClick}
        onViewAllClick={() => {
          dismissPopup();
          setActiveTab("gantt");
          localStorage.setItem('activeTab', "gantt");
        }}
      />
      
      {/* Mobile compatibility indicator */}
      {!isMobileCompatible && (
        <div className="fixed bottom-4 left-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800 max-w-xs">
          ⚠️ Notifications may not work on this device/browser
        </div>
      )}
    </div>
  )
}
