import { toast as hotToast } from 'react-hot-toast'

interface ToastOptions {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  duration?: number
  style?: Record<string, unknown>
  [key: string]: unknown
}

class ToastManager {
  private static instance: ToastManager
  private activeToasts: Set<string> = new Set()
  private toastCooldown: Map<string, number> = new Map()
  private readonly COOLDOWN_TIME = 3000 // 3 seconds

  private constructor() {}

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager()
    }
    return ToastManager.instance
  }

  private canShowToast(message: string): boolean {
    const now = Date.now()
    const lastShown = this.toastCooldown.get(message)
    
    if (lastShown && (now - lastShown) < this.COOLDOWN_TIME) {
      return false
    }
    
    return true
  }

  private showToast(
    message: string, 
    type: 'success' | 'error' | 'loading',
    options?: ToastOptions
  ) {
    if (!this.canShowToast(message)) {
      return
    }

    this.toastCooldown.set(message, Date.now())
    
    const toastOptions = {
      position: 'top-right' as const,
      duration: 1000,
      style: {
        background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#6B7280',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        maxWidth: '300px',
        zIndex: 9999
      },
      ...options
    }

    switch (type) {
      case 'success':
        return hotToast.success(message, toastOptions)
      case 'error':
        return hotToast.error(message, toastOptions)
      case 'loading':
        return hotToast.loading(message, toastOptions)
    }
  }

  success(message: string, options?: ToastOptions) {
    return this.showToast(message, 'success', options)
  }

  error(message: string, options?: ToastOptions) {
    return this.showToast(message, 'error', options)
  }

  loading(message: string, options?: ToastOptions) {
    return this.showToast(message, 'loading', options)
  }

  // Remove a toast
  dismiss(toastId?: string) {
    return hotToast.dismiss(toastId)
  }

  // Remove all toasts
  dismissAll() {
    return hotToast.dismiss()
  }
}

// Export singleton instance
export const toast = ToastManager.getInstance()
