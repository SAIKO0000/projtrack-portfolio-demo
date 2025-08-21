import { useCallback } from "react"
import {
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  Clock,
} from "lucide-react"

export const useGetStatusIcon = () => {
  return useCallback((status: string | null) => {
    if (!status) return <AlertCircle className="h-4 w-4" />
    
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "in-progress":
        return <Play className="h-4 w-4" />
      case "planning":
        return <Clock className="h-4 w-4" />
      case "on-hold":
        return <Pause className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }, [])
}
