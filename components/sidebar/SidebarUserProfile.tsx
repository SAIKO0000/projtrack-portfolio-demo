"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/user-avatar"
import { Settings, User, LogOut } from "lucide-react"
import { UserInfo } from './types'

interface SidebarUserProfileProps {
  userInfo: UserInfo
  collapsed?: boolean
  isMobile?: boolean
  onProfileClickAction: () => void
  onLogoutAction: () => void
}

export function SidebarUserProfile({ 
  userInfo, 
  collapsed = false, 
  isMobile = false,
  onProfileClickAction,
  onLogoutAction
}: SidebarUserProfileProps) {
  const { userName, userPosition, userEmail, avatarUrl } = userInfo

  if (isMobile) {
    return (
      <div className="p-3 border-t border-gray-200/60 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full p-0 h-auto hover:bg-transparent group">
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50/80 to-gray-100/80 rounded-lg w-full transition-all duration-200 group-hover:from-orange-50 group-hover:to-orange-100 group-hover:shadow-sm border border-gray-200/60 group-hover:border-orange-200 backdrop-blur-sm">
                <UserAvatar 
                  avatarUrl={avatarUrl}
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
                avatarUrl={avatarUrl}
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
            <DropdownMenuItem onClick={onProfileClickAction} className="p-3 text-sm rounded-md hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <User className="h-4 w-4 mr-3 text-gray-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Profile Settings</p>
                <p className="text-xs text-gray-500">Manage your account</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogoutAction} className="p-3 text-sm rounded-md text-red-600 hover:bg-red-50 focus:bg-red-50 hover:text-red-700 focus:text-red-700 transition-colors duration-200 cursor-pointer">
              <LogOut className="h-4 w-4 mr-3" />
              <div className="flex-1">
                <p className="font-medium">Sign Out</p>
                <p className="text-xs text-red-500">End your current session</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="p-4 border-t border-gray-200/70 bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm flex-shrink-0 shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full p-0 h-auto hover:bg-transparent group">
            {!collapsed ? (
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl w-full transition-all duration-500 group-hover:from-orange-50 group-hover:to-orange-100 group-hover:shadow-lg border border-gray-200 group-hover:border-orange-200 group-hover:scale-[1.02] transform">
                <UserAvatar 
                  avatarUrl={avatarUrl}
                  userName={userName}
                  size="md"
                  className="transition-transform duration-500 group-hover:scale-110 ring-2 ring-white shadow-md group-hover:shadow-lg"
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-orange-700 transition-colors duration-300">{userName}</p>
                  <p className="text-sm text-gray-500 truncate group-hover:text-orange-600 transition-colors duration-300">{userPosition}</p>
                </div>
                <Settings className="h-5 w-5 text-gray-400 transition-all duration-500 group-hover:text-orange-600 group-hover:rotate-180 group-hover:scale-110" />
              </div>
            ) : (
              <div className="flex justify-center p-3 rounded-xl transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-orange-50 group-hover:to-orange-100 border border-transparent group-hover:border-orange-200 group-hover:shadow-lg group-hover:scale-110 transform">
                <UserAvatar 
                  avatarUrl={avatarUrl}
                  userName={userName}
                  size="md"
                  className="transition-transform duration-500 group-hover:scale-125 ring-2 ring-white shadow-md group-hover:shadow-xl"
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
          className="w-80 p-2 shadow-xl border-gray-200 bg-white/95 backdrop-blur-sm"
          style={{ transform: 'translateY(-20px)' }}
        >
          <div className="flex items-center space-x-3 p-4 mb-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <UserAvatar 
              avatarUrl={avatarUrl}
              userName={userName}
              size="lg"
              className="ring-2 ring-white shadow-sm"
            />
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900">{userName}</p>
              <p className="text-sm text-gray-500">{userPosition}</p>
              <p className="text-xs text-gray-400 break-words">{userEmail}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onProfileClickAction} className="p-4 text-sm rounded-lg hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-300 cursor-pointer">
            <User className="h-5 w-5 mr-3 text-gray-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Profile Settings</p>
              <p className="text-xs text-gray-500">Manage your account and preferences</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogoutAction} className="p-4 text-sm rounded-lg text-red-600 hover:bg-red-50 focus:bg-red-50 hover:text-red-700 focus:text-red-700 transition-colors duration-300 cursor-pointer">
            <LogOut className="h-5 w-5 mr-3" />
            <div className="flex-1">
              <p className="font-semibold">Sign Out</p>
              <p className="text-xs text-red-500">End your current session</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
