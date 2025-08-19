"use client"

import { supabase } from '@/lib/supabase'
import { DeadlineNotificationService } from '@/lib/deadline-notification-service'
import { MobileNotificationService } from '@/lib/mobile-notification-service'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  location?: string
  type: string
  project_id?: string
  created_at?: string
  updated_at?: string
  projects?: {
    name: string
    client?: string
  }
}

interface EventNotification {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  location?: string
  type: string
  project_name?: string
  hoursUntil: number
  isToday: boolean
  isUpcoming: boolean
}

export class EnhancedNotificationService {
  private static instance: EnhancedNotificationService
  private mobileService: MobileNotificationService

  constructor() {
    this.mobileService = MobileNotificationService.getInstance()
  }

  static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService()
    }
    return EnhancedNotificationService.instance
  }

  // Check for calendar events happening today or soon
  async checkCalendarEvents(): Promise<EventNotification[]> {
    try {
      console.log('📅 Checking calendar events for notifications...')
      
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Format dates for comparison
      const todayString = this.formatDateString(today)
      const tomorrowString = this.formatDateString(tomorrow)

      // Fetch events for today and tomorrow
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          projects (
            name,
            client
          )
        `)
        .in('date', [todayString, tomorrowString])
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (error) {
        console.error('❌ Error fetching calendar events:', error)
        return []
      }

      if (!events || events.length === 0) {
        console.log('✅ No calendar events found for today/tomorrow')
        return []
      }

      // Process events and determine notification urgency
      const eventNotifications: EventNotification[] = []
      
      for (const event of events as CalendarEvent[]) {
        const eventDateTime = this.parseEventDateTime(event.date, event.time)
        const now = new Date()
        const hoursUntil = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        
        // Only notify for future events within 24 hours
        if (hoursUntil > 0 && hoursUntil <= 24) {
          const notification: EventNotification = {
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            type: event.type,
            project_name: event.projects?.name,
            hoursUntil: Math.round(hoursUntil * 10) / 10, // Round to 1 decimal
            isToday: event.date === todayString,
            isUpcoming: hoursUntil <= 2 // Within 2 hours
          }
          eventNotifications.push(notification)
        }
      }

      console.log(`📊 Found ${eventNotifications.length} calendar events for notifications`)
      eventNotifications.forEach(event => {
        console.log(`  • ${event.title} - ${event.hoursUntil}h remaining (${event.date} ${event.time || 'No time'})`)
      })

      return eventNotifications
    } catch (error) {
      console.error('❌ Error checking calendar events:', error)
      return []
    }
  }

  // Send notifications for calendar events
  async sendCalendarEventNotifications(events: EventNotification[]): Promise<void> {
    if (events.length === 0) return

    try {
      for (const event of events) {
        await this.sendEventNotification(event)
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error('❌ Error sending calendar event notifications:', error)
    }
  }

  // Send individual event notification
  private async sendEventNotification(event: EventNotification): Promise<void> {
    try {
      const urgencyText = this.getEventUrgencyText(event.hoursUntil)
      const timeText = event.time ? ` at ${this.formatTime(event.time)}` : ''
      const locationText = event.location ? ` • ${event.location}` : ''
      const projectText = event.project_name ? ` (${event.project_name})` : ''
      
      const title = `📅 ${event.type.charAt(0).toUpperCase() + event.type.slice(1)} ${urgencyText}`
      const body = `${event.title}${projectText}\n${this.formatDate(event.date)}${timeText}${locationText}`

      // Determine notification priority
      const requireInteraction = event.hoursUntil <= 1 // Require interaction for events within 1 hour
      const vibrationPattern = event.hoursUntil <= 1 ? [200, 100, 200] : [100]

      console.log(`📱 Sending calendar notification: ${event.title}`)

      await this.mobileService.sendMobileNotification({
        title,
        body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: `calendar-event-${event.id}`,
        requireInteraction,
        vibrate: vibrationPattern,
        data: {
          eventId: event.id,
          eventType: event.type,
          hoursUntil: event.hoursUntil.toString(),
          type: 'calendar_event',
          date: event.date,
          time: event.time || ''
        }
      })
    } catch (error) {
      console.error(`❌ Error sending notification for event ${event.id}:`, error)
    }
  }

  // Comprehensive notification check (tasks + events)
  async checkAllUpcomingNotifications(): Promise<{tasks: unknown[], events: EventNotification[]}> {
    try {
      console.log('🔔 Starting comprehensive notification check...')
      
      // Check both tasks and calendar events
      const [upcomingTasks, upcomingEvents] = await Promise.all([
        DeadlineNotificationService.checkTaskDeadlines(),
        this.checkCalendarEvents()
      ])

      console.log(`📊 Summary: ${upcomingTasks.length} tasks, ${upcomingEvents.length} events`)

      // Send notifications for both
      if (upcomingTasks.length > 0) {
        console.log('📨 Sending task deadline notifications...')
        for (const task of upcomingTasks) {
          await DeadlineNotificationService.sendBrowserNotification(task)
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }

      if (upcomingEvents.length > 0) {
        console.log('📨 Sending calendar event notifications...')
        await this.sendCalendarEventNotifications(upcomingEvents)
      }

      return { tasks: upcomingTasks, events: upcomingEvents }
    } catch (error) {
      console.error('❌ Error in comprehensive notification check:', error)
      return { tasks: [], events: [] }
    }
  }

  // Helper methods
  private formatDateString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  private parseEventDateTime(date: string, time?: string): Date {
    const eventDate = new Date(date)
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      eventDate.setHours(hours, minutes, 0, 0)
    }
    return eventDate
  }

  private getEventUrgencyText(hoursUntil: number): string {
    if (hoursUntil <= 0.5) return 'Starting Soon!'
    if (hoursUntil <= 1) return 'in 1 Hour'
    if (hoursUntil <= 2) return 'in 2 Hours'
    if (hoursUntil <= 6) return 'Today'
    return 'Tomorrow'
  }

  private formatTime(timeString: string): string {
    try {
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours)
      const minute = minutes
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minute} ${ampm}`
    } catch {
      return timeString
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      if (this.formatDateString(date) === this.formatDateString(today)) {
        return 'Today'
      } else if (this.formatDateString(date) === this.formatDateString(tomorrow)) {
        return 'Tomorrow'
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }
    } catch {
      return dateString
    }
  }
}

export const enhancedNotificationService = EnhancedNotificationService.getInstance()
