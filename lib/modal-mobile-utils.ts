"use client"

import { useEffect } from 'react'

/**
 * Hook to manage mobile header visibility when modals are open
 * Hides the sidebar mobile header when modal is open on mobile devices
 */
export function useModalMobileHide(isOpen: boolean) {
  useEffect(() => {
    // Check if we're on mobile
    const isMobile = window.innerWidth < 1024

    if (isMobile && isOpen) {
      // Hide the mobile header by adding a class to the body
      document.body.classList.add('modal-mobile-open')
    } else {
      // Remove the class when modal closes or on desktop
      document.body.classList.remove('modal-mobile-open')
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-mobile-open')
    }
  }, [isOpen])
}

/**
 * CSS class to hide mobile header when modal is open
 * Add this CSS to your global styles
 */
export const modalMobileStyles = `
  @media (max-width: 1023px) {
    .modal-mobile-open .sidebar-mobile-header {
      display: none !important;
    }
  }
`
