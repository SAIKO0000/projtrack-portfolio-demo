import { Card, CardContent } from "@/components/ui/card"
import {
  FolderOpen,
  Play,
  CheckCircle,
  Pause,
} from "lucide-react"
import { type Project } from "../types/project-types"

interface ProjectStatsProps {
  projects: Project[]
}

export function ProjectStats({ projects }: ProjectStatsProps) {
  const stats = [
    {
      title: "Total Projects",
      value: projects.length,
      description: "All projects",
      icon: FolderOpen,
      color: "blue"
    },
    {
      title: "In Progress",
      value: projects.filter((p) => p.status === "in-progress").length,
      description: "Active work",
      icon: Play,
      color: "orange"
    },
    {
      title: "Completed",
      value: projects.filter((p) => p.status === "completed").length,
      description: "Finished projects",
      icon: CheckCircle,
      color: "green"
    },
    {
      title: "On Hold",
      value: projects.filter((p) => p.status === "on-hold").length,
      description: "Paused projects",
      icon: Pause,
      color: "yellow"
    }
  ]

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: { border: "border-l-blue-500", bg: "bg-blue-500/10", text: "text-blue-600" },
      orange: { border: "border-l-orange-500", bg: "bg-orange-500/10", text: "text-orange-600" },
      green: { border: "border-l-green-500", bg: "bg-green-500/10", text: "text-green-600" },
      yellow: { border: "border-l-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-600" }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
      {stats.map((stat) => {
        const colors = getColorClasses(stat.color)
        const Icon = stat.icon
        
        return (
          <Card key={stat.title} className={`${colors.border} bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50`}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
