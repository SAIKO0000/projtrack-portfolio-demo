"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { Projects } from "@/components/projects"
import { GanttChartEnhanced } from "@/components/gantt-chart-enhanced-supabase"
import { Calendar } from "@/components/calendar"
import { Team } from "@/components/team"
import { Reports } from "@/components/reports"
import { Notifications } from "@/components/notifications"
import { useAuth } from "@/lib/auth"
import { useAutoNotifications } from "@/lib/hooks/useAutoNotifications"

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const router = useRouter()

  // Auto-trigger notifications when user logs in
  useAutoNotifications()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setActiveTab("gantt")
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Clear project selection when navigating away from gantt or when going to gantt without project selection
    if (tab !== "gantt") {
      setSelectedProjectId(null)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />
      case "projects":
        return <Projects onProjectSelect={handleProjectSelect} />
      case "gantt":
        return <GanttChartEnhanced selectedProjectId={selectedProjectId} />
      case "calendar":
        return <Calendar />
      case "team":
        return <Team />
      case "notifications":
        return <Notifications />
      case "reports":
        return <Reports />
      default:
        return <Dashboard />
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
      <Sidebar activeTab={activeTab} onTabChangeAction={handleTabChange} />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pt-20 lg:pt-0">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
