"use client"

import { useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { User, Mail, Briefcase, Users, Phone, FileText, Save, X } from "lucide-react"
import { toast } from "react-hot-toast"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

const departments = [
  "Engineering",
  "Project Management", 
  "Field Operations",
  "Quality Assurance",
  "Administration",
  "Safety",
  "Finance",
  "Other"
]

const positions = [
  "Senior Electrical Engineer",
  "Project Manager",
  "Electrical Technician",
  "Site Supervisor", 
  "Quality Engineer",
  "Safety Officer",
  "Administrative Assistant",
  "Field Engineer",
  "Design Engineer",
  "Project Coordinator",
  "Other"
]

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || "",
    email: user?.email || "",
    position: user?.user_metadata?.position || "",
    department: user?.user_metadata?.department || "",
    phone: user?.user_metadata?.phone || "",
    prcLicense: user?.user_metadata?.prc_license || "",
    yearsExperience: user?.user_metadata?.years_experience || ""
  })

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Here you would typically update the user profile
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast.success('Profile updated successfully!', {
        duration: 3000,
        style: {
          background: 'linear-gradient(to right, #f97316, #ea580c)',
          color: 'white',
        },
      })
      
      onClose()
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [onClose])

  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }, [])

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.position.trim() !== '' &&
      formData.department.trim() !== '' &&
      !isLoading
    )
  }, [formData, isLoading])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md border-0 shadow-2xl"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%)',
        }}
      >
        {/* Background Overlay */}
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10" />
        
        <DialogHeader className="space-y-4 pb-6">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            Profile Settings
          </DialogTitle>
          
          {/* User Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xl font-semibold">
                  {getInitials(formData.name || user?.email || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-orange-200 pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="profile-name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white/70"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="profile-email"
                    type="email"
                    value={formData.email}
                    className="pl-10 h-11 border-gray-300 bg-gray-50 text-gray-600"
                    disabled
                    readOnly
                  />
                </div>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-orange-200 pb-2">
              Professional Information
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="profile-position" className="text-sm font-medium text-gray-700">
                  Position <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Select
                    value={formData.position}
                    onValueChange={(value) => handleInputChange("position", value)}
                    disabled={isLoading}
                    required
                  >
                    <SelectTrigger className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white/70">
                      <SelectValue placeholder="Select your position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="profile-department" className="text-sm font-medium text-gray-700">
                  Department <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleInputChange("department", value)}
                    disabled={isLoading}
                    required
                  >
                    <SelectTrigger className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white/70">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="profile-phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="profile-phone"
                    type="tel"
                    placeholder="+63 917 123 4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white/70"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* PRC License */}
              <div className="space-y-2">
                <Label htmlFor="profile-prcLicense" className="text-sm font-medium text-gray-700">
                  PRC License
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="profile-prcLicense"
                    type="text"
                    placeholder="EE-12345"
                    value={formData.prcLicense}
                    onChange={(e) => handleInputChange("prcLicense", e.target.value)}
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white/70"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Years Experience */}
              <div className="space-y-2">
                <Label htmlFor="profile-yearsExperience" className="text-sm font-medium text-gray-700">
                  Years Experience
                </Label>
                <Input
                  id="profile-yearsExperience"
                  type="number"
                  placeholder="5"
                  value={formData.yearsExperience}
                  onChange={(e) => handleInputChange("yearsExperience", e.target.value)}
                  className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white/70"
                  disabled={isLoading}
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-orange-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl"
              disabled={!isFormValid}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
