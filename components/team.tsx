"use client"

import { useState, useMemo, useCallback } from "react"
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

  // Memoize filtered members to prevent unnecessary recalculations
  const filteredMembers = useMemo(() => {
    return personnel.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.position && member.position.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesSearch
    })
  }, [personnel, searchTerm])

  // Memoize statistics
  const stats = useMemo(() => ({
    totalMembers: personnel.length,
    activeProjects: projects.length
  }), [personnel.length, projects.length])

  const handleViewProfile = useCallback((member: Personnel) => {
    setSelectedPersonnel(member)
    setIsProfileModalOpen(true)
  }, [])

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
    <div className="p-3 sm:p-5 lg:p-9 space-y-4 sm:space-y-5 lg:space-y-7 overflow-y-auto h-full bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
      {/* Modern Header with Glassmorphism */}
      <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 lg:p-7 rounded-xl shadow-lg border border-gray-200/50">
        {/* Desktop layout */}
        <div className="hidden sm:flex sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl xl:text-5xl font-bold text-gray-900">Team</h1>
                <p className="text-base lg:text-lg text-gray-600 mt-1">Manage your electrical engineering team and workload</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="sm:hidden text-center">
          <div className="flex items-center gap-3 justify-center mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Team</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">Manage your electrical engineering team and workload</p>
        </div>
      </div>

      {/* Enhanced Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-7">
        <Card className="border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-semibold text-gray-700 uppercase tracking-wide">Total Members</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
                <p className="text-sm text-gray-600">Active team members</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-semibold text-gray-700 uppercase tracking-wide">Active Projects</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
                <p className="text-sm text-gray-600">Currently running</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Filter */}
      <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200/50">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
