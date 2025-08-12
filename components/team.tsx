"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/user-avatar"
import { Search, Mail, Phone, Users, Briefcase } from "lucide-react"
import { usePersonnel } from "@/lib/hooks/usePersonnel"
import { useProjectsQuery } from "@/lib/hooks/useProjectsOptimized"
import { ProfileModal } from "./profile-modal"

type Personnel = {
  id: number
  name: string
  email: string
  position?: string
  phone?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export function Team() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  
  const { personnel, loading, error } = usePersonnel()
  const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery()

  const filteredMembers = personnel.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.position && member.position.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  const totalMembers = personnel.length
  const activeProjects = projects.length

  const handleViewProfile = (member: Personnel) => {
    setSelectedPersonnel(member)
    setIsProfileModalOpen(true)
  }

  if (loading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading team members: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto h-full bg-gray-50/30">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your electrical engineering team and workload</p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Total Members</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{totalMembers}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Active Projects</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{activeProjects}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Filter */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-orange-200 group">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Profile Picture */}
                <div className="relative">
                  <UserAvatar
                    avatarUrl={member.avatar_url}
                    userName={member.name}
                    size="lg"
                    className="transition-transform duration-300 group-hover:scale-105 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Member Info */}
                <div className="space-y-1 w-full">
                  <h3 className="font-semibold text-sm text-gray-900 leading-tight">{member.name}</h3>
                  <p className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full inline-block">
                    {member.position || "Team Member"}
                  </p>
                </div>

                {/* Contact Icons */}
                <div className="flex items-center justify-center space-x-3 w-full">
                  {member.email && (
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors">
                      <Mail className="h-3 w-3 text-blue-600" />
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center justify-center w-7 h-7 bg-green-50 rounded-full hover:bg-green-100 transition-colors">
                      <Phone className="h-3 w-3 text-green-600" />
                    </div>
                  )}
                </div>

                {/* View Profile Button */}
                <Button 
                  onClick={() => handleViewProfile(member)} 
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-500 mb-4 max-w-sm mx-auto">
            {searchTerm 
              ? "Try adjusting your search criteria to find team members" 
              : "Get started by adding your first team member"
            }
          </p>
        </div>
      )}

      {/* Profile Modal */}
      {selectedPersonnel && (
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onCloseAction={() => {
            setIsProfileModalOpen(false)
            setSelectedPersonnel(null)
          }}
          personnel={selectedPersonnel}
        />
      )}
    </div>
  )
}
