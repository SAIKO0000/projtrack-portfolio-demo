import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface ReportsFiltersProps {
  searchTerm: string
  projectFilter: string
  categoryFilter: string
  statusFilter: string
  uniqueProjects: string[]
  uniqueCategories: string[]
  onSearchChange: (value: string) => void
  onProjectFilterChange: (value: string) => void
  onCategoryFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
}

export function ReportsFilters({
  searchTerm,
  projectFilter,
  categoryFilter,
  statusFilter,
  uniqueProjects,
  uniqueCategories,
  onSearchChange,
  onProjectFilterChange,
  onCategoryFilterChange,
  onStatusFilterChange,
}: ReportsFiltersProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200/50">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-3 sm:gap-4">
          <Select value={projectFilter} onValueChange={onProjectFilterChange}>
            <SelectTrigger className="w-36 sm:w-40 h-10">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map((projectName) => (
                <SelectItem key={projectName} value={projectName}>
                  {projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-36 sm:w-40 h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category || ""}>
                  {category || "Uncategorized"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-28 sm:w-32 h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="revision">Revision</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
