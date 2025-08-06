"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Briefcase, Phone, FileText, X } from "lucide-react"
import type { Database } from "@/lib/supabase.types"

type Personnel = Database['public']['Tables']['personnel']['Row']

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  personnel?: Personnel
}

export function ProfileModal({ isOpen, onClose, personnel }: ProfileModalProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (!personnel) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Personnel Profile
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
            <Avatar className="h-20 w-20">
              <AvatarImage src={personnel.avatar_url || ""} alt={personnel.name} />
              <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xl font-semibold">
                {getInitials(personnel.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{personnel.name}</h2>
              <p className="text-lg text-gray-600">{personnel.position || "Not specified"}</p>
              <p className="text-sm text-gray-500">{personnel.department || "Department not specified"}</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {personnel.email && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{personnel.email}</p>
                  </div>
                </div>
              )}

              {personnel.phone && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{personnel.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Professional Information
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Briefcase className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{personnel.department || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Years of Experience</p>
                  <p className="font-medium">{personnel.years_experience || 0} years</p>
                </div>
              </div>

              {personnel.prc_license && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">PRC License</p>
                    <p className="font-medium">{personnel.prc_license}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {personnel.created_at && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Additional Information
              </h3>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {new Date(personnel.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
