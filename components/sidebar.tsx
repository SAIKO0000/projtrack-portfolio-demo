"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Users,
  Bell,
  FileText,
  Settings,
  ChevronLeft,
  User,
  LogOut,
  BarChart3,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProfileModal } from "@/components/profile-modal"
import { UserAvatar } from "@/components/user-avatar"
import { useCurrentUserPersonnel } from "@/lib/hooks/useCurrentUserPersonnel"
import { useAuth } from "@/lib/auth"
import Image from "next/image"

interface SidebarProps {
  readonly activeTab: string
  readonly onTabChangeAction: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChangeAction }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user, signOut } = useAuth()
  const { personnel } = useCurrentUserPersonnel()

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    onTabChangeAction(tab)
    if (isMobile) {
      setMobileMenuOpen(false)
    }
  }, [onTabChangeAction, isMobile])

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
    <>
      {/* Mobile Menu Button - Fixed top bar */}
      {isMobile && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-[90]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image 
                src="/logo.svg" 
                alt="GYG Power Systems" 
                width={32}
                height={24}
                className="w-8 h-6 object-contain"
                priority
              />
              <div>
                <h1 className="text-sm font-semibold text-gray-900">GYG Power Systems</h1>
                <p className="text-xs text-gray-500">Project Tracking</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleMobileMenu} className="p-2">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] lg:hidden" onClick={toggleMobileMenu}>
          <div 
            className="fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md shadow-lg z-[110] transform transition-transform duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200/60">
              <div className="flex items-center space-x-3">
                <Image 
                  src="/logo.svg" 
                  alt="GYG Power Systems" 
                  width={40}
                  height={28}
                  className="w-10 h-7 object-contain"
                  priority
                />
                <div>
                  <h1 className="text-sm font-semibold text-gray-900">GYG Power Systems</h1>
                  <p className="text-xs text-gray-500">Project Tracking</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto">
              <nav className="px-4 space-y-1 py-4">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={`w-full justify-start h-10 px-3 ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                        : "text-gray-700 hover:bg-gray-100/80"
                    }`}
                    onClick={() => handleTabChange(item.id)}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </nav>
            </div>

            {/* Mobile User Profile at Bottom */}
            <div className="p-3 border-t border-gray-200/60 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full p-0 h-auto hover:bg-transparent group">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50/80 to-gray-100/80 rounded-lg w-full transition-all duration-200 group-hover:from-orange-50 group-hover:to-orange-100 group-hover:shadow-sm border border-gray-200/60 group-hover:border-orange-200 backdrop-blur-sm">
                      <UserAvatar 
                        avatarUrl={personnel?.avatar_url}
                        userName={userName}
                        size="sm"
                        className="transition-transform duration-200 group-hover:scale-105 ring-2 ring-white shadow-sm"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-700">{userName}</p>
                        <p className="text-xs text-gray-500 truncate group-hover:text-orange-600">{userPosition}</p>
                      </div>
                      <Settings className="h-4 w-4 text-gray-400 transition-all duration-200 group-hover:text-orange-600 group-hover:rotate-90" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  side="top"
                  alignOffset={-10}
                  sideOffset={16}
                  className="w-80 p-2 shadow-lg border-gray-200"
                >
                  <div className="flex items-center space-x-3 p-3 mb-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                    <UserAvatar 
                      avatarUrl={personnel?.avatar_url}
                      userName={userName}
                      size="md"
                      className="ring-2 ring-white shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{userPosition}</p>
                      <p className="text-xs text-gray-400 break-all leading-tight">{userEmail}</p>
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
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex bg-gradient-to-b from-white via-gray-50/30 to-white border-r border-gray-200/60 backdrop-blur-md transition-all duration-300 flex-col h-full shadow-lg ${collapsed ? "w-16" : "w-64"}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200/70 bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm flex-shrink-0 shadow-sm">
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
              <Button variant="ghost" size="sm" onClick={toggleCollapsed} className="p-1 hover:bg-gray-100/80 hover:shadow-sm transition-all duration-200 rounded-lg">
                <ChevronLeft className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleCollapsed} 
                className="p-0.0001 w-0.0001 h-0.001 rounded-sm hover:bg-orange-100/80 hover:shadow-md transition-all duration-200 group border border-transparent hover:border-orange-200"
                title="Expand sidebar"
              >
                <Image 
                  src="/logo.svg" 
                  alt="GYG Power Systems" 
                  width={9990}
                  height={10990}
                  className="w-30 h-5 object-contain group-hover:scale-110 transition-transform duration-200 filter group-hover:drop-shadow-sm"
                  priority
                />
              </Button>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable content area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-gray-50/20">
          <nav className="px-4 space-y-2 pb-4 pt-4">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-center h-12 transition-all duration-200 group relative overflow-hidden ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:text-orange-700 hover:shadow-md hover:border-orange-200 border border-transparent"
                } ${collapsed ? "px-1" : "px-3"}`}
                onClick={() => onTabChangeAction(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`transition-all duration-200 group-hover:scale-110 ${collapsed ? "h-6 w-6" : "h-4 w-4 mr-3"} ${activeTab === item.id ? "drop-shadow-sm" : ""}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium transition-all duration-200">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800 shadow-sm border border-orange-200">
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
        <div className="p-3 border-t border-gray-200/70 bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm flex-shrink-0 shadow-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full p-0 h-auto hover:bg-transparent group">
                {!collapsed ? (
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg w-full transition-all duration-200 group-hover:from-orange-50 group-hover:to-orange-100 group-hover:shadow-lg border border-gray-200 group-hover:border-orange-200 group-hover:scale-[1.02] transform">
                    <UserAvatar 
                      avatarUrl={personnel?.avatar_url}
                      userName={userName}
                      size="sm"
                      className="transition-transform duration-200 group-hover:scale-110 ring-2 ring-white shadow-md group-hover:shadow-lg"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-700 transition-colors duration-200">{userName}</p>
                      <p className="text-xs text-gray-500 truncate group-hover:text-orange-600 transition-colors duration-200">{userPosition}</p>
                    </div>
                    <Settings className="h-4 w-4 text-gray-400 transition-all duration-200 group-hover:text-orange-600 group-hover:rotate-180 group-hover:scale-110" />
                  </div>
                ) : (
                  <div className="flex justify-center p-2 rounded-lg transition-all duration-200 group-hover:bg-gradient-to-r group-hover:from-orange-50 group-hover:to-orange-100 border border-transparent group-hover:border-orange-200 group-hover:shadow-lg group-hover:scale-110 transform">
                    <UserAvatar 
                      avatarUrl={personnel?.avatar_url}
                      userName={userName}
                      size="sm"
                      className="transition-transform duration-200 group-hover:scale-125 ring-2 ring-white shadow-md group-hover:shadow-xl"
                    />
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
              <div className="flex items-center space-x-3 p-3 mb-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <UserAvatar 
                  avatarUrl={personnel?.avatar_url}
                  userName={userName}
                  size="md"
                  className="ring-2 ring-white shadow-sm"
                />
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
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onCloseAction={() => setShowProfileModal(false)} 
      />
    </>
  )
}