import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface RefreshButtonProps {
  onRefresh: () => void
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="default"
      onClick={onRefresh}
      className="flex items-center gap-2 h-10 px-5 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
    >
      <RefreshCw className="h-3 w-3" />
      Refresh
    </Button>
  )
}
