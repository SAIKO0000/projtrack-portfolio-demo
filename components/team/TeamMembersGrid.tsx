"use client"

import { TeamMemberCard } from "./TeamMemberCard"
import { Personnel } from "./types"

type TeamMembersGridProps = {
  members: Personnel[]
  onViewProfileAction: (member: Personnel) => void
}

export function TeamMembersGrid({ members, onViewProfileAction }: TeamMembersGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {members.map((member) => (
        <TeamMemberCard 
          key={member.id} 
          member={member} 
          onViewProfileAction={onViewProfileAction} 
        />
      ))}
    </div>
  )
}
