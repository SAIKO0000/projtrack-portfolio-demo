"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Image from "next/image"

interface SidebarMobileHeaderProps {
  isMobile: boolean
  mobileMenuOpen: boolean
  onToggleMobileMenuAction: () => void
}

export function SidebarMobileHeader({ 
  isMobile, 
  mobileMenuOpen, 
  onToggleMobileMenuAction 
}: SidebarMobileHeaderProps) {
  if (!isMobile) return null

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/0 backdrop-blur-xl p-4 z-[90] shadow-lg shadow-gray-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-4 flex items-center justify-center rounded-lg bg-white/0 backdrop-blur-sm shadow-none border border-white/0">
            <Image 
              src="/logo.svg" 
              alt="GYG Power Systems" 
              width={40}
              height={30}
              className="w-10 h-7 object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">GYG Power Systems</h1>
            <p className="text-xs text-gray-600 font-medium hidden sm:block">Electrical Engineering Solutions</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleMobileMenuAction} 
          className="p-3 hover:bg-white/0 backdrop-blur-sm rounded-lg border border-transparent hover:border-gray-0 shadow-none hover:shadow-md transition-all duration-300"
        >
          {mobileMenuOpen ? 
            <X className="h-5 w-5 text-gray-700" /> : 
            <Menu className="h-5 w-5 text-gray-700" />
          }
        </Button>
      </div>
    </div>
  )
}
