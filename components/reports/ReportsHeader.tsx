import { Button } from "@/components/ui/button"
import { FileText, Upload } from "lucide-react"
import { ReportUploadModal } from "../report-upload-modal"

interface ReportsHeaderProps {
  onUploadComplete: () => void
}

export function ReportsHeader({ onUploadComplete }: ReportsHeaderProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 lg:p-7 rounded-xl shadow-lg border border-gray-200/50">
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900">Reports & Documents</h1>
              <p className="text-base lg:text-lg text-gray-600 mt-1">Manage project documents, reports, and files</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ReportUploadModal onUploadComplete={onUploadComplete}>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 w-full sm:w-auto h-10 px-5 py-2">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </ReportUploadModal>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden text-center">
        <div className="flex items-center gap-3 justify-center mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports & Documents</h1>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">Manage project documents, reports, and files</p>
        <div className="flex gap-2 justify-center">
          <ReportUploadModal onUploadComplete={onUploadComplete}>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-10 px-4">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </ReportUploadModal>
        </div>
      </div>
    </div>
  )
}
