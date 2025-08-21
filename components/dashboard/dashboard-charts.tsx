"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { getStatusIndicatorColor } from "./dashboard-utils"

interface DashboardChartsProps {
  projectProgressData: Array<{
    name: string
    completed: number
    ongoing: number
    started: number
  }>
  statusData: Array<{
    name: string
    value: number
    color: string
  }>
}

export function DashboardCharts({ projectProgressData, statusData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-7">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/50">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Project Progress</CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">Monthly project completion trends</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={280} className="sm:h-[330px]">
            <BarChart data={projectProgressData} margin={{ top: 15, right: 15, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                fontSize={11}
                fontWeight={500}
                angle={-45}
                textAnchor="end"
                height={65}
                interval={0}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis fontSize={11} fontWeight={500} width={35} tick={{ fill: '#6b7280' }} />
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{ 
                  fontSize: '13px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="started" fill="#3B82F6" name="Started" radius={[2, 2, 0, 0]} />
              <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ongoing" fill="#F59E0B" name="Ongoing" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/50">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Project Status Distribution</CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">Current status of all projects</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={280} className="sm:h-[330px]">
            <PieChart margin={{ top: 15, right: 15, left: 15, bottom: 15 }}>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} projects`, name]}
                labelFormatter={() => 'Project Status'}
                contentStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusIndicatorColor(item.name)} flex-shrink-0`} />
                <span className="text-xs sm:text-sm text-gray-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
