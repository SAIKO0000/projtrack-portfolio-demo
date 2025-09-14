import { FileText } from "lucide-react"

interface ProjectsHeaderProps {
  onProjectCreated: () => void
  ProjectFormModal: React.ComponentType<{ onProjectCreated: () => void }>
}

export function ProjectsHeader({ 
  onProjectCreated, 
  ProjectFormModal
}: ProjectsHeaderProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7 2xl:p-8 rounded-xl shadow-lg border border-gray-200/50">
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900">Projects</h1>
              <p className="text-base lg:text-lg xl:text-xl text-gray-600 mt-1">Manage and track all your electrical engineering projects</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ProjectFormModal onProjectCreated={onProjectCreated} />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden text-center">
        <div className="flex items-center gap-3 justify-center mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">Manage and track all your electrical engineering projects</p>
        <div className="flex justify-center">
          <ProjectFormModal onProjectCreated={onProjectCreated} />
        </div>
      </div>
    </div>
  )
}
