"use client"

import { useState, useCallback, useMemo } from "react"
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Users,
  Bell,
  FileText,
  Settings,
  ChevronLeft,
  Search,
  User,
  LogOut,
  Moon,
  Sun,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProfileModal } from "@/components/profile-modal"
import { useAuth } from "@/lib/auth"
import Image from "next/image"

interface SidebarProps {
  readonly activeTab: string
  readonly onTabChangeAction: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChangeAction }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const { user, signOut } = useAuth()

  const menuItems = useMemo(() => [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderOpen, badge: "" },
    { id: "gantt", label: "Gantt Chart", icon: BarChart3 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "team", label: "Team", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell, badge: "" },
    { id: "reports", label: "Reports", icon: FileText },
  ], [])

  const handleProfileClick = useCallback(() => {
    setShowProfileModal(true)
  }, [])

  const handleLogout = useCallback(async () => {
    await signOut()
  }, [signOut])

  const handleThemeToggle = useCallback(() => {
    setIsDarkMode(prev => !prev)
    console.log("Theme toggled to:", !isDarkMode ? "dark" : "light")
  }, [isDarkMode])

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  const userInitials = useMemo(() => {
    const name = user?.user_metadata?.name || user?.email || "User"
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [user])

  const userName = useMemo(() => {
    return user?.user_metadata?.name || "User"
  }, [user])

  const userPosition = useMemo(() => {
    return user?.user_metadata?.position || "Team Member"
  }, [user])

  const userEmail = useMemo(() => {
    return user?.email || ""
  }, [user])

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-full ${collapsed ? "w-16" : "w-64"}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-7 flex items-center justify-center">
                <Image 
                  src="/logo.svg" 
                  alt="GYG Power Systems" 
                  width={40}
                  height={28}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">GYG Power Systems</h1>
                <p className="text-xs text-gray-500">Project Tracking</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleCollapsed} className="p-1">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleCollapsed} 
              className="p-0.1 w-10 h-8 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
              title="Expand sidebar"
            >
              <Image 
                src="/logo.svg" 
                alt="GYG Power Systems" 
                width={40}
                height={32}
                className="w-10 h-8 object-contain group-hover:scale-105 transition-transform duration-200"
                priority
              />
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search projects..." className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white" />
          </div>
        </div>
      )}

      {/* Navigation - Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 space-y-1 pb-4">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={`w-full justify-start h-10 ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  : "text-gray-700 hover:bg-gray-100"
              } ${collapsed ? "px-2" : "px-3"}`}
              onClick={() => onTabChangeAction(item.id)}
            >
              <item.icon className={`h-4 w-4 ${collapsed ? "" : "mr-3"}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </nav>
      </div>

      {/* User Profile - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full p-0 h-auto hover:bg-transparent group">
              {!collapsed ? (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg w-full transition-all duration-200 group-hover:bg-gray-100 group-hover:shadow-sm">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    <span className="text-white text-sm font-medium">{userInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userPosition}</p>
                  </div>
                  <Settings className="h-4 w-4 text-gray-500 transition-colors duration-200 group-hover:text-gray-700" />
                </div>
              ) : (
                <div className="flex justify-center p-2 rounded-lg transition-all duration-200 group-hover:bg-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:shadow-md">
                    <span className="text-white text-sm font-medium">{userInitials}</span>
                  </div>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            side="right"
            alignOffset={-10}
            sideOffset={16}
            className="w-72 p-2 shadow-lg border-gray-200"
            style={{ transform: 'translateY(-20px)' }}
          >
            <div className="flex items-center space-x-3 p-3 mb-2 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">{userInitials}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userPosition}</p>
                <p className="text-xs text-gray-400">{userEmail}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick} className="p-3 text-sm rounded-md hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <User className="h-4 w-4 mr-3 text-gray-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Profile Settings</p>
                <p className="text-xs text-gray-500">Manage your account</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleThemeToggle} className="p-3 text-sm rounded-md hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 cursor-pointer">
              {isDarkMode ? (
                <Sun className="h-4 w-4 mr-3 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 mr-3 text-blue-500" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{isDarkMode ? "Light Mode" : "Dark Mode"}</p>
                <p className="text-xs text-gray-500">Switch appearance theme</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="p-3 text-sm rounded-md text-red-600 hover:bg-red-50 focus:bg-red-50 hover:text-red-700 focus:text-red-700 transition-colors duration-200 cursor-pointer">
              <LogOut className="h-4 w-4 mr-3" />
              <div className="flex-1">
                <p className="font-medium">Sign Out</p>
                <p className="text-xs text-red-500">End your current session</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onCloseAction={() => setShowProfileModal(false)} 
      />
    </div>
  )
}
