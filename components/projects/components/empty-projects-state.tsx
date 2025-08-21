import { Search } from "lucide-react"

interface EmptyProjectsStateProps {
  ProjectFormModal: React.ComponentType<{ onProjectCreated: () => void }>
  onProjectCreated: () => void
}

export function EmptyProjectsState({ ProjectFormModal, onProjectCreated }: EmptyProjectsStateProps) {
  return (
    <div className="text-center py-8 sm:py-12">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No projects found</h3>
      <p className="text-sm sm:text-base text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
      <ProjectFormModal onProjectCreated={onProjectCreated} />
    </div>
  )
}
