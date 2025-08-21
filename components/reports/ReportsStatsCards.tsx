import { Card, CardContent } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { type EnhancedReport } from "./types"

interface ReportsStatsCardsProps {
  reports: EnhancedReport[]
}

export function ReportsStatsCards({ reports }: ReportsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
      <Card className="border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Documents</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{reports.length}</p>
              <p className="text-sm text-gray-600">All files uploaded</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-yellow-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pending Review</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{reports.filter((r) => r.status === "pending").length}</p>
              <p className="text-sm text-gray-600">Awaiting approval</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Approved</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{reports.filter((r) => r.status === "approved").length}</p>
              <p className="text-sm text-gray-600">Ready for use</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Need Revision</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{reports.filter((r) => r.status === "revision").length}</p>
              <p className="text-sm text-gray-600">Requires changes</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
