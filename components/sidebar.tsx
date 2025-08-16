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
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200/60 shadow-lg backdrop-blur-md p-4 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-1 shadow-sm border border-orange-200/30">
                <Image 
                  src="/logo.svg" 
                  alt="GYG Power Systems" 
                  width={32}
                  height={24}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800 tracking-tight">GYG Power Systems</h1>
                <p className="text-xs text-slate-500 font-medium">Project Tracking</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleMobileMenu} 
              className="p-2 rounded-xl hover:bg-slate-100 hover:shadow-md transition-all duration-200 border border-transparent hover:border-slate-200/50"
            >
              {mobileMenuOpen ? 
                <X className="h-5 w-5 text-slate-600" /> : 
                <Menu className="h-5 w-5 text-slate-600" />
              }
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={toggleMobileMenu}>
          <div 
            className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-white via-slate-50/50 to-white shadow-2xl z-50 transform transition-transform duration-300 border-r border-slate-200/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200/60 bg-gradient-to-r from-white to-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-7 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-1 shadow-sm border border-orange-200/30">
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
                  <h1 className="text-sm font-bold text-slate-800 tracking-tight">GYG Power Systems</h1>
                  <p className="text-xs text-slate-500 font-medium">Project Tracking</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto py-2">
              <nav className="px-3 space-y-1">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={`w-full justify-start h-11 transition-all duration-200 ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700"
                        : "text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 hover:shadow-md border border-transparent hover:border-slate-200/50"
                    }`}
                    onClick={() => handleTabChange(item.id)}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className={`ml-auto text-xs font-semibold shadow-sm ${
                          activeTab === item.id 
                            ? "bg-orange-200 text-orange-800 border border-orange-300" 
                            : "bg-orange-100 text-orange-700 border border-orange-200"
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </nav>
            </div>

            {/* Mobile User Profile */}
            <div className="p-3 border-t border-slate-200/60 bg-gradient-to-r from-white to-slate-50">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full p-0 h-auto hover:bg-transparent group">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl w-full transition-all duration-200 group-hover:from-orange-50 group-hover:to-orange-100/70 group-hover:shadow-lg border border-slate-200/50 group-hover:border-orange-200/60">
                      <UserAvatar 
                        avatarUrl={personnel?.avatar_url}
                        userName={userName}
                        size="sm"
                        className="transition-transform duration-200 group-hover:scale-110 ring-2 ring-white shadow-md"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-orange-700">{userName}</p>
                        <p className="text-xs text-slate-500 truncate group-hover:text-orange-600 font-medium">{userPosition}</p>
                      </div>
                      <Settings className="h-4 w-4 text-slate-400 transition-all duration-200 group-hover:text-orange-600 group-hover:rotate-90" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  side="top"
                  alignOffset={-10}
                  sideOffset={16}
                  className="w-80 p-2 shadow-xl border-slate-200/60 bg-white/95 backdrop-blur-md rounded-xl"
                >
                  <div className="flex items-center space-x-3 p-3 mb-2 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 shadow-sm">
                    <UserAvatar 
                      avatarUrl={personnel?.avatar_url}
                      userName={userName}
                      size="md"
                      className="ring-2 ring-white shadow-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{userPosition}</p>
                      <p className="text-xs text-slate-400 break-all leading-tight">{userEmail}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-200/60" />
                  <DropdownMenuItem onClick={handleProfileClick} className="p-3 text-sm rounded-xl hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 focus:bg-gradient-to-r focus:from-slate-100 focus:to-slate-50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-slate-200/50 hover:shadow-sm">
                    <User className="h-4 w-4 mr-3 text-slate-600 group-hover:text-orange-600 transition-colors duration-200" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 group-hover:text-slate-900">Profile Settings</p>
                      <p className="text-xs text-slate-500 group-hover:text-slate-600">Manage your account</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-200/60" />
                  <DropdownMenuItem onClick={handleLogout} className="p-3 text-sm rounded-xl text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 focus:bg-gradient-to-r focus:from-red-50 focus:to-red-100/50 hover:text-red-700 focus:text-red-700 transition-all duration-200 cursor-pointer group border border-transparent hover:border-red-200/50 hover:shadow-sm">
                    <LogOut className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                    <div className="flex-1">
                      <p className="font-semibold">Sign Out</p>
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
      <div className={`hidden lg:flex bg-gradient-to-b from-slate-50 via-white to-slate-50 border-r border-slate-200/60 shadow-lg transition-all duration-300 flex-col h-full ${collapsed ? "w-16" : "w-64"}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200/60 flex-shrink-0 bg-gradient-to-r from-white to-slate-50 shadow-sm">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-7 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-1 shadow-sm border border-orange-200/30">
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
                  <h1 className="text-sm font-bold text-slate-800 tracking-tight">GYG Power Systems</h1>
                  <p className="text-xs text-slate-500 font-medium">Project Tracking</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleCollapsed} 
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-all duration-200 hover:shadow-sm"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleCollapsed} 
                className="p-1.5 w-10 h-10 rounded-xl hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 transition-all duration-200 group border border-transparent hover:border-orange-200/50 hover:shadow-md"
                title="Expand sidebar"
              >
                <div className="w-8 h-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-1 shadow-sm border border-orange-200/30 group-hover:scale-105 transition-transform duration-200">
                  <Image 
                    src="/logo.svg" 
                    alt="GYG Power Systems" 
                    width={40}
                    height={32}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </Button>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable content area */}
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start h-11 transition-all duration-200 relative group ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/30 transform hover:scale-[1.02]"
                    : "text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 hover:text-slate-800 hover:shadow-md border border-transparent hover:border-slate-200/50"
                } ${collapsed ? "px-2" : "px-3"}`}
                onClick={() => onTabChangeAction(item.id)}
              >
                {activeTab === item.id && !collapsed && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-300 rounded-r-full shadow-sm" />
                )}
                <item.icon className={`h-4 w-4 ${collapsed ? "" : "mr-3"} ${
                  activeTab === item.id ? "drop-shadow-sm" : "group-hover:scale-110"
                } transition-all duration-200`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className={`ml-auto text-xs font-semibold shadow-sm ${
                          activeTab === item.id 
                            ? "bg-orange-200 text-orange-800 border border-orange-300" 
                            : "bg-orange-100 text-orange-700 border border-orange-200"
                        }`}
                      >
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
        <div className="p-3 border-t border-slate-200/60 flex-shrink-0 bg-gradient-to-r from-white to-slate-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full p-0 h-auto hover:bg-transparent group">
                {!collapsed ? (
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl w-full transition-all duration-200 group-hover:from-orange-50 group-hover:to-orange-100/70 group-hover:shadow-lg border border-slate-200/50 group-hover:border-orange-200/60 backdrop-blur-sm">
                    <UserAvatar 
                      avatarUrl={personnel?.avatar_url}
                      userName={userName}
                      size="sm"
                      className="transition-transform duration-200 group-hover:scale-110 ring-2 ring-white shadow-md group-hover:shadow-lg"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover:text-orange-700">{userName}</p>
                      <p className="text-xs text-slate-500 truncate group-hover:text-orange-600 font-medium">{userPosition}</p>
                    </div>
                    <Settings className="h-4 w-4 text-slate-400 transition-all duration-200 group-hover:text-orange-600 group-hover:rotate-90 drop-shadow-sm" />
                  </div>
                ) : (
                  <div className="flex justify-center p-2 rounded-xl transition-all duration-200 group-hover:bg-gradient-to-r group-hover:from-orange-50 group-hover:to-orange-100 border border-transparent group-hover:border-orange-200/50 group-hover:shadow-lg">
                    <UserAvatar 
                      avatarUrl={personnel?.avatar_url}
                      userName={userName}
                      size="sm"
                      className="transition-transform duration-200 group-hover:scale-125 ring-2 ring-white shadow-md group-hover:shadow-xl group-hover:ring-orange-200"
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
              className="w-72 p-2 shadow-xl border-slate-200/60 bg-white/95 backdrop-blur-md rounded-xl"
              style={{ transform: 'translateY(-20px)' }}
            >
              <div className="flex items-center space-x-3 p-3 mb-2 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 shadow-sm">
                <UserAvatar 
                  avatarUrl={personnel?.avatar_url}
                  userName={userName}
                  size="md"
                  className="ring-2 ring-white shadow-md"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{userName}</p>
                  <p className="text-xs text-slate-500 font-medium">{userPosition}</p>
                  <p className="text-xs text-slate-400">{userEmail}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-slate-200/60" />
              <DropdownMenuItem onClick={handleProfileClick} className="p-3 text-sm rounded-xl hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 focus:bg-gradient-to-r focus:from-slate-100 focus:to-slate-50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-slate-200/50 hover:shadow-sm">
                <User className="h-4 w-4 mr-3 text-slate-600 group-hover:text-orange-600 transition-colors duration-200" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 group-hover:text-slate-900">Profile Settings</p>
                  <p className="text-xs text-slate-500 group-hover:text-slate-600">Manage your account</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200/60" />
              <DropdownMenuItem onClick={handleLogout} className="p-3 text-sm rounded-xl text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 focus:bg-gradient-to-r focus:from-red-50 focus:to-red-100/50 hover:text-red-700 focus:text-red-700 transition-all duration-200 cursor-pointer group border border-transparent hover:border-red-200/50 hover:shadow-sm">
                <LogOut className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                <div className="flex-1">
                  <p className="font-semibold">Sign Out</p>
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