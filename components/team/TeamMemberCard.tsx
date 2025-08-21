"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { Mail, Phone } from "lucide-react"
import { Personnel } from "./types"

type TeamMemberCardProps = {
  member: Personnel
  onViewProfileAction: (member: Personnel) => void
}

export function TeamMemberCard({ member, onViewProfileAction }: TeamMemberCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-orange-200 group">
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
            onClick={() => onViewProfileAction(member)} 
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm"
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
