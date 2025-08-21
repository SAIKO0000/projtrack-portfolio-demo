"use client"

import { Bell, CheckCircle, Calendar, Edit, FileText, ImageIcon, Activity } from "lucide-react"

interface NotificationIconProps {
  type: string
}

export function NotificationIcon({ type }: NotificationIconProps) {
  switch (type) {
    case "photo":
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    case "report":
      return <FileText className="h-4 w-4 text-orange-500" />
    case "task":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "task_update":
      return <Edit className="h-4 w-4 text-blue-500" />
    case "event":
      return <Calendar className="h-4 w-4 text-purple-500" />
    case "project":
      return <Activity className="h-4 w-4 text-indigo-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}
