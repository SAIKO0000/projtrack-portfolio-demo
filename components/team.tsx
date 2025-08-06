"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Search, Plus, Mail, Phone, MoreHorizontal, Users, UserCheck, Clock, Briefcase } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const teamMembers = [
  {
    id: 1,
    name: "John Doe",
    position: "Senior Electrical Engineer",
    department: "Engineering",
    email: "john.doe@gygpower.com",
    phone: "+63 917 123 4567",
    prcLicense: "EE-12345",
    yearsExperience: 8,
    currentProjects: ["CSA Makati Building", "Victory Distribution Center"],
    workload: 85,
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    skills: ["Power Systems", "AutoCAD", "Project Management"],
    joinDate: "2019-03-15",
  },
  {
    id: 2,
    name: "Maria Santos",
    position: "Project Manager",
    department: "Project Management",
    email: "maria.santos@gygpower.com",
    phone: "+63 917 234 5678",
    prcLicense: "PM-67890",
    yearsExperience: 12,
    currentProjects: ["Assumption Sports Complex", "CSA Makati Building"],
    workload: 75,
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    skills: ["Project Management", "Team Leadership", "Risk Management"],
    joinDate: "2017-01-20",
  },
  {
    id: 3,
    name: "Carlos Rivera",
    position: "Electrical Technician",
    department: "Field Operations",
    email: "carlos.rivera@gygpower.com",
    phone: "+63 917 345 6789",
    prcLicense: "ET-11111",
    yearsExperience: 5,
    currentProjects: ["Victory Distribution Center"],
    workload: 60,
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    skills: ["Installation", "Troubleshooting", "Safety Protocols"],
    joinDate: "2021-06-10",
  },
  {
    id: 4,
    name: "Ana Garcia",
    position: "Quality Assurance Engineer",
    department: "Quality Control",
    email: "ana.garcia@gygpower.com",
    phone: "+63 917 456 7890",
    prcLicense: "QA-22222",
    yearsExperience: 6,
    currentProjects: ["Assumption Sports Complex"],
    workload: 45,
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    skills: ["Quality Control", "Testing", "Documentation"],
    joinDate: "2020-09-05",
  },
  {
    id: 5,
    name: "Robert Chen",
    position: "Senior Project Engineer",
    department: "Engineering",
    email: "robert.chen@gygpower.com",
    phone: "+63 917 567 8901",
    prcLicense: "EE-33333",
    yearsExperience: 10,
    currentProjects: ["CSA Makati Building", "Unitop Mall"],
    workload: 90,
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    skills: ["Electrical Design", "Code Compliance", "Team Leadership"],
    joinDate: "2018-04-12",
  },
  {
    id: 6,
    name: "Elena Rodriguez",
    position: "Site Supervisor",
    department: "Field Operations",
    email: "elena.rodriguez@gygpower.com",
    phone: "+63 917 678 9012",
    prcLicense: "SS-44444",
    yearsExperience: 7,
    currentProjects: ["Unitop Mall"],
    workload: 70,
    avatar: "/placeholder.svg?height=40&width=40",
    status: "on-leave",
    skills: ["Site Management", "Safety", "Coordination"],
    joinDate: "2019-11-08",
  },
]

export function Team() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "on-leave":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getWorkloadColor = (workload: number) => {
    if (workload >= 80) return "text-red-600"
    if (workload >= 60) return "text-yellow-600"
    return "text-green-600"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || member.department === departmentFilter
    const matchesStatus = statusFilter === "all" || member.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const departments = [...new Set(teamMembers.map((member) => member.department))]
  const totalMembers = teamMembers.length
  const activeMembers = teamMembers.filter((m) => m.status === "active").length
  const averageWorkload = Math.round(teamMembers.reduce((sum, m) => sum + m.workload, 0) / totalMembers)

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">Manage your electrical engineering team and workload</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl font-bold">{activeMembers}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Workload</p>
                <p className="text-2xl font-bold">{averageWorkload}%</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.position}</p>
                    <Badge className={getStatusColor(member.status)} size="sm">
                      {member.status.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Department:</span>
                    <p className="font-medium">{member.department}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Experience:</span>
                    <p className="font-medium">{member.yearsExperience} years</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Current Workload</span>
                    <span className={`text-sm font-medium ${getWorkloadColor(member.workload)}`}>
                      {member.workload}%
                    </span>
                  </div>
                  <Progress value={member.workload} className="h-2" />
                </div>

                <div>
                  <span className="text-sm text-gray-500">Current Projects:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.currentProjects.map((project, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {project}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </span>
                    <span className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}
