import { type Project } from "../types/project-types"
import { ProjectCard } from "./project-card"

interface ProjectGridProps {
  projects: Project[]
  isAdmin: boolean
  getProjectTaskProgress: (projectId: string) => number
  getProjectTaskCounts: (projectId: string) => { total: number; completed: number }
  getProjectReports: (projectId: string) => Array<{ id: string; file_name: string }>
  onProjectSelect?: (projectId: string) => void
  onStatusUpdate: (projectId: string, newStatus: string) => void
  onEditProject: (projectId: string) => void
  onDeleteProject: (projectId: string, projectName: string) => void
  onViewReports: (projectId: string, projectName: string) => void
  ReportUploadModal: React.ComponentType<{ 
    preselectedProjectId: string
    children: React.ReactNode 
  }>
}

export function ProjectGrid({
  projects,
  isAdmin,
  getProjectTaskProgress,
  getProjectTaskCounts,
  getProjectReports,
  onProjectSelect,
  onStatusUpdate,
  onEditProject,
  onDeleteProject,
  onViewReports,
  ReportUploadModal
}: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isAdmin={isAdmin}
          taskProgress={getProjectTaskProgress(project.id)}
          taskCounts={getProjectTaskCounts(project.id)}
          reportsCount={getProjectReports(project.id).length}
          onProjectSelect={onProjectSelect}
          onStatusUpdate={onStatusUpdate}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
          onViewReports={onViewReports}
          ReportUploadModal={ReportUploadModal}
        />
      ))}
    </div>
  )
}
