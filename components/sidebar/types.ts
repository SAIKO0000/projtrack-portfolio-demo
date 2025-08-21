import { LucideIcon } from "lucide-react"

// Sidebar types and interfaces
export interface SidebarProps {
  readonly activeTab: string
  readonly onTabChangeAction: (tab: string) => void
}

export interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
  badge?: string
}

export interface SidebarState {
  collapsed: boolean
  mobileMenuOpen: boolean
  showProfileModal: boolean
  isMobile: boolean
}

export interface UserInfo {
  userName: string
  userPosition: string
  userEmail: string
  avatarUrl?: string | null
}
