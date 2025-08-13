"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { 
  User, 
  Mail, 
  Briefcase,
  Phone, 
  Edit3, 
  Save, 
  Loader2
} from "lucide-react"
import { useCurrentUserPersonnel } from "@/lib/hooks/useCurrentUserPersonnel"
import { useAuth } from "@/lib/auth"
import { toast } from "react-hot-toast"
import type { Database } from "@/lib/supabase.types"

type Personnel = Database['public']['Tables']['personnel']['Row']

interface ProfileModalProps {
  readonly isOpen: boolean
  readonly onCloseAction: () => void
  readonly personnel?: Personnel | null
}

export function ProfileModal({ isOpen, onCloseAction, personnel: viewingPersonnel }: ProfileModalProps) {
  const { personnel: currentUserPersonnel, loading: currentUserLoading, updating, updatePersonnel, refetch } = useCurrentUserPersonnel()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })

  // Determine which personnel data to show
  // If viewingPersonnel is provided, show that personnel's profile
  // Otherwise, show current user's profile (for editing)
  const displayedPersonnel = viewingPersonnel || currentUserPersonnel
  const isOwnProfile = !viewingPersonnel || (viewingPersonnel?.email === user?.email)
  const loading = viewingPersonnel ? false : currentUserLoading

  // Initialize form data when personnel data loads
  const initializeFormData = useCallback(() => {
    if (displayedPersonnel) {
      setFormData({
        name: displayedPersonnel.name || '',
        phone: displayedPersonnel.phone || ''
      })
    }
  }, [displayedPersonnel])

  // Initialize form data when modal opens or personnel data changes
  useEffect(() => {
    if (isOpen && displayedPersonnel) {
      initializeFormData()
    }
  }, [isOpen, displayedPersonnel, initializeFormData])

  const getInitials = useCallback((name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [])

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      // Cancel editing - reset form data
      initializeFormData()
    } else {
      // Start editing - ensure form data is current
      initializeFormData()
    }
    setIsEditing(!isEditing)
  }, [isEditing, initializeFormData])

  const handleInputChange = useCallback((field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleAvatarUpdateAction = useCallback(async () => {
    // Immediately refresh the personnel data to reflect the avatar change
    if (isOwnProfile && !viewingPersonnel && refetch) {
      // Wait a moment for the database to update, then refetch
      setTimeout(() => {
        refetch()
      }, 1000)
    }
  }, [isOwnProfile, viewingPersonnel, refetch])

  const handleSave = useCallback(async () => {
    if (!isOwnProfile) return // Can't edit other people's profiles
    
    try {
      const updates = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null
      }

      const result = await updatePersonnel(updates)
      
      if (result.success) {
        setIsEditing(false)
        toast.success("Profile updated successfully!")
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error("Failed to update profile")
    }
  }, [formData, updatePersonnel, isOwnProfile])

  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0
  }, [formData.name])

  const userName = useMemo(() => {
    return displayedPersonnel?.name || user?.user_metadata?.name || "User"
  }, [displayedPersonnel, user])

  const userPosition = useMemo(() => {
    return displayedPersonnel?.position || user?.user_metadata?.position || "Team Member"
  }, [displayedPersonnel, user])

  const userEmail = useMemo(() => {
    return displayedPersonnel?.email || user?.email || ""
  }, [displayedPersonnel, user])

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onCloseAction}>
        <DialogContent className="w-[95vw] max-w-[400px] max-h-[85vh] overflow-y-auto mx-4">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200 shadow-2xl mx-4">
        <DialogHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              <span className="break-words">{isOwnProfile ? "Profile Settings" : `${userName}'s Profile`}</span>
            </DialogTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isOwnProfile && !isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditToggle}
                  className="hover:bg-orange-50 hover:border-orange-200 flex-1 sm:flex-none"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : isOwnProfile && isEditing ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditToggle}
                    disabled={updating}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={!isFormValid || updating}
                    className="bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-none"
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 px-1">
          {/* Compact Profile Header */}
          <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="flex-shrink-0 self-center sm:self-start">
              {isOwnProfile ? (
                <ProfilePictureUpload
                  key={displayedPersonnel?.avatar_url || 'no-avatar'}
                  currentAvatarUrl={displayedPersonnel?.avatar_url}
                  personnelId={displayedPersonnel?.id || ''}
                  userName={userName}
                  onAvatarUpdateAction={handleAvatarUpdateAction}
                  size="md"
                  editable={true}
                />
              ) : (
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-white shadow-md">
                  <AvatarImage src={displayedPersonnel?.avatar_url || ""} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-base sm:text-lg font-semibold">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{userName}</h2>
              <div className="flex flex-col sm:flex-row items-center sm:justify-between mt-1 gap-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {userPosition}
                </Badge>
                {displayedPersonnel?.created_at && (
                  <div className="text-center sm:text-right">
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Date(displayedPersonnel.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-gray-600">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{userEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Editable Fields */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Contact Information</h3>
              {isEditing && <Badge variant="outline" className="text-xs">Editing</Badge>}
            </div>
            
            <div className="space-y-3">
              {/* Name Field */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Full Name
                </Label>
                {isEditing && isOwnProfile ? (
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="h-8 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                ) : (
                  <div className="px-2 py-1 bg-gray-50 rounded text-sm font-medium text-gray-900">
                    {displayedPersonnel?.name || 'Not specified'}
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </Label>
                {isEditing && isOwnProfile ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className="h-8 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                ) : (
                  <div className="px-2 py-1 bg-gray-50 rounded text-sm font-medium text-gray-900">
                    {displayedPersonnel?.phone || 'Not specified'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
