"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Briefcase, 
  Phone, 
  FileText, 
  X, 
  Edit3, 
  Save, 
  Loader2,
  Lock,
  Calendar,
  MapPin
} from "lucide-react"
import { useCurrentUserPersonnel } from "@/lib/hooks/useCurrentUserPersonnel"
import { useAuth } from "@/lib/auth"
import { toast } from "react-hot-toast"

interface ProfileModalProps {
  readonly isOpen: boolean
  readonly onCloseAction: () => void
}

export function ProfileModal({ isOpen, onCloseAction }: ProfileModalProps) {
  const { personnel, loading, updating, updatePersonnel } = useCurrentUserPersonnel()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    years_experience: 0
  })

  // Initialize form data when personnel data loads
  const initializeFormData = useCallback(() => {
    if (personnel) {
      setFormData({
        name: personnel.name || '',
        phone: personnel.phone || '',
        years_experience: personnel.years_experience || 0
      })
    }
  }, [personnel])

  // Initialize form data when modal opens or personnel data changes
  useEffect(() => {
    if (isOpen && personnel) {
      initializeFormData()
    }
  }, [isOpen, personnel, initializeFormData])

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

  const handleSave = useCallback(async () => {
    try {
      const updates = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        years_experience: formData.years_experience || null
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
  }, [formData, updatePersonnel])

  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0
  }, [formData.name])

  const userName = useMemo(() => {
    return personnel?.name || user?.user_metadata?.name || "User"
  }, [personnel, user])

  const userPosition = useMemo(() => {
    return personnel?.position || user?.user_metadata?.position || "Team Member"
  }, [personnel, user])

  const userEmail = useMemo(() => {
    return personnel?.email || user?.email || ""
  }, [personnel, user])

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onCloseAction}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200 shadow-2xl">
        <DialogHeader className="pb-6">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-6 w-6 text-orange-500" />
              Profile Settings
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditToggle}
                  className="hover:bg-orange-50 hover:border-orange-200"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditToggle}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={!isFormValid || updating}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={onCloseAction}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
              <AvatarImage src={personnel?.avatar_url || ""} alt={userName} />
              <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-2xl font-semibold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900">{userName}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                  {userPosition}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {personnel?.department || "Department not specified"}
              </p>
            </div>
          </div>

          {/* Editable Fields Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
              {isEditing && <Badge variant="outline" className="text-xs">Editing Mode</Badge>}
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{personnel?.name || 'Not specified'}</p>
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{personnel?.phone || 'Not specified'}</p>
                  </div>
                )}
              </div>

              {/* Years of Experience Field */}
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Years of Experience
                </Label>
                {isEditing ? (
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.years_experience}
                    onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                    placeholder="Enter years of experience"
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{personnel?.years_experience || 0} years</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Read-Only Fields Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Professional Information</h3>
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                <Lock className="h-3 w-3 mr-1" />
                Read Only
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Email Field (Read-only) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
                  <p className="font-medium text-gray-600">{userEmail}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                </div>
              </div>

              {/* Position Field (Read-only) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Position
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
                  <p className="font-medium text-gray-600">{userPosition}</p>
                  <p className="text-xs text-gray-500 mt-1">Position is managed by administrators</p>
                </div>
              </div>

              {/* Department Field (Read-only) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Department
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
                  <p className="font-medium text-gray-600">{personnel?.department || 'Not specified'}</p>
                  <p className="text-xs text-gray-500 mt-1">Department is managed by administrators</p>
                </div>
              </div>

              {/* PRC License Field (Read-only) */}
              {personnel?.prc_license && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PRC License
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
                    <p className="font-medium text-gray-600">{personnel.prc_license}</p>
                    <p className="text-xs text-gray-500 mt-1">License information is protected</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {personnel?.created_at && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Account Information</h3>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Member Since</span>
                  </div>
                  <p className="font-medium text-blue-900 mt-1">
                    {new Date(personnel.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
