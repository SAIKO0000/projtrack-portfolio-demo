import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { type ProjectFilters } from "../types/project-types"

interface ProjectFiltersComponentProps {
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
  uniqueProjects: Array<{ id: string; name: string }>
  isMobile?: boolean
  ProjectFormModal: React.ComponentType<{ onProjectCreated: () => void }>
  onProjectCreated: () => void
}

export function ProjectFiltersComponent({ 
  filters, 
  onFiltersChange, 
  uniqueProjects, 
  isMobile = false,
  ProjectFormModal,
  onProjectCreated
}: ProjectFiltersComponentProps) {
  const updateFilter = (key: keyof ProjectFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  if (isMobile) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg border border-gray-200/50 sm:hidden">
        {/* Mobile Filters Row 1 - Search only */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
        
        {/* Mobile Filters Row 2 - Status and New Project */}
        <div className="grid grid-cols-2 gap-3">
          <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In-Progress</SelectItem>
              <SelectItem value="on-hold">On-Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <ProjectFormModal onProjectCreated={onProjectCreated} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200/50 hidden sm:block">
      {/* All Filters in One Row */}
      <div className="flex gap-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects or clients..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <div className="w-44">
          <Select value={filters.projectFilter} onValueChange={(value) => updateFilter('projectFilter', value)}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In-Progress</SelectItem>
              <SelectItem value="on-hold">On-Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
