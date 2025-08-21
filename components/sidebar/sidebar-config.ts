import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Users,
  Bell,
  FileText,
  BarChart3,
} from "lucide-react"
import { MenuItem } from './types'

// Menu items configuration
export const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderOpen, badge: "" },
  { id: "gantt", label: "Gantt Chart", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell, badge: "" },
  { id: "reports", label: "Reports", icon: FileText },
]
