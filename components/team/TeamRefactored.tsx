"use client"

import { useState, useMemo, useCallback } from "react"
import { usePersonnel } from "@/lib/hooks/usePersonnel"
import { useProjectsQuery } from "@/lib/hooks/useProjectsOptimized"
import { ProfileModal } from "../profile-modal"

// Import modular components
import { Personnel, TeamStats } from "./types"
import { TeamHeader } from "./TeamHeader"
import { TeamStatsCards } from "./TeamStatsCards"
import { TeamSearch } from "./TeamSearch"
import { TeamMembersGrid } from "./TeamMembersGrid"
import { TeamEmptyState } from "./TeamEmptyState"
import { TeamLoadingState, TeamErrorState } from "./TeamStates"

export function TeamRefactored() {
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
  const stats: TeamStats = useMemo(() => ({
    totalMembers: personnel.length,
    activeProjects: projects.length
  }), [personnel.length, projects.length])

  const handleViewProfile = useCallback((member: Personnel) => {
    setSelectedPersonnel(member)
    setIsProfileModalOpen(true)
  }, [])

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  if (loading || projectsLoading) {
    return <TeamLoadingState />
  }

  if (error) {
    return <TeamErrorState error={error} />
  }

  return (
    <div className="p-3 sm:p-5 lg:p-9 space-y-4 sm:space-y-5 lg:space-y-7 overflow-y-auto h-full bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
      {/* Modern Header with Glassmorphism */}
      <TeamHeader />

      {/* Enhanced Team Stats */}
      <TeamStatsCards stats={stats} />

      {/* Search Filter */}
      <TeamSearch searchTerm={searchTerm} onSearchChangeAction={handleSearchChange} />

      {/* Team Members Grid */}
      {filteredMembers.length > 0 ? (
        <TeamMembersGrid members={filteredMembers} onViewProfileAction={handleViewProfile} />
      ) : (
        <TeamEmptyState searchTerm={searchTerm} />
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
