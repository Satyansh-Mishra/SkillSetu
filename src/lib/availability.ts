/**
 * AVAILABILITY UTILITIES
 * 
 * Helper functions for managing teacher availability,
 * time slots, and booking conflicts
 */

import { prisma } from './db'

// ==========================================
// TIME UTILITIES
// ==========================================

/**
 * Convert time string to minutes since midnight
 * @param time - Time string in "HH:MM" format
 * @returns Minutes since midnight
 * 
 * Example: "14:30" → 870 minutes
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes to time string
 * @param minutes - Minutes since midnight
 * @returns Time string in "HH:MM" format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Round time to nearest interval
 * @param date - Date to round
 * @param intervalMinutes - Interval in minutes (e.g., 15, 30, 60)
 */
export function roundToInterval(date: Date, intervalMinutes: number): Date {
  const ms = 1000 * 60 * intervalMinutes
  return new Date(Math.round(date.getTime() / ms) * ms)
}

/**
 * Get day of week name
 */
export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayIndex]
}

// ==========================================
// AVAILABILITY CHECKING
// ==========================================

/**
 * Check if teacher is available at a specific time
 */
export async function isTeacherAvailable(
  teacherId: string,
  startTime: Date,
  endTime: Date
): Promise<{ available: boolean; reason?: string }> {
  
  // 1. Check if teacher has any existing bookings at this time
  const conflictingLesson = await prisma.lesson.findFirst({
    where: {
      teacherId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      scheduledAt: {
        gte: startTime,
        lt: endTime,
      },
    },
  })
  
  if (conflictingLesson) {
    return {
      available: false,
      reason: 'Teacher has another lesson at this time',
    }
  }
  
  // 2. Check blocked times
  const blockedTime = await prisma.blockedTime.findFirst({
    where: {
      userId: teacherId,
      startTime: { lte: startTime },
      endTime: { gte: endTime },
    },
  })
  
  if (blockedTime) {
    return {
      available: false,
      reason: blockedTime.reason || 'Teacher is unavailable at this time',
    }
  }
  
  // 3. Check weekly availability
  const dayOfWeek = startTime.getDay()
  const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`
  const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
  
  const availability = await prisma.availability.findFirst({
    where: {
      userId: teacherId,
      dayOfWeek,
      isAvailable: true,
      startTime: { lte: startTimeStr },
      endTime: { gte: endTimeStr },
    },
  })
  
  if (!availability) {
    return {
      available: false,
      reason: 'Outside teacher\'s regular availability',
    }
  }
  
  // 4. Check booking settings (advance notice)
  const settings = await prisma.bookingSettings.findUnique({
    where: { userId: teacherId },
  })
  
  if (settings) {
    const now = new Date()
    const hoursUntilLesson = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilLesson < settings.minAdvanceHours) {
      return {
        available: false,
        reason: `Need at least ${settings.minAdvanceHours} hours advance notice`,
      }
    }
    
    const daysUntilLesson = hoursUntilLesson / 24
    if (daysUntilLesson > settings.maxAdvanceDays) {
      return {
        available: false,
        reason: `Can only book up to ${settings.maxAdvanceDays} days in advance`,
      }
    }
  }
  
  return { available: true }
}

// ==========================================
// TIME SLOT GENERATION
// ==========================================

/**
 * Generate available time slots for a teacher
 * @param teacherId - Teacher's user ID
 * @param startDate - Start date to generate slots
 * @param endDate - End date to generate slots
 * @param duration - Lesson duration in minutes
 */
export async function generateTimeSlots(
  teacherId: string,
  startDate: Date,
  endDate: Date,
  duration: number = 60
): Promise<Array<{ startTime: Date; endTime: Date; available: boolean }>> {
  
  // 1. Get teacher's weekly availability
  const availabilities = await prisma.availability.findMany({
    where: {
      userId: teacherId,
      isAvailable: true,
    },
  })
  
  if (availabilities.length === 0) {
    return []
  }
  
  // 2. Get booking settings
  const settings = await prisma.bookingSettings.findUnique({
    where: { userId: teacherId },
  })
  
  const bufferMinutes = settings?.bufferMinutes || 15
  const slotInterval = duration + bufferMinutes
  
  const slots: Array<{ startTime: Date; endTime: Date; available: boolean }> = []
  
  // 3. Iterate through each day
  const currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    
    // Find availability for this day
    const dayAvailability = availabilities.find(a => a.dayOfWeek === dayOfWeek)
    
    if (dayAvailability) {
      const startMinutes = timeToMinutes(dayAvailability.startTime)
      const endMinutes = timeToMinutes(dayAvailability.endTime)
      
      // Generate slots for this day
      for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += slotInterval) {
        const slotStart = new Date(currentDate)
        slotStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
        
        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + duration)
        
        // Check if slot is in the past
        if (slotStart < new Date()) {
          continue
        }
        
        // Check availability
        const { available } = await isTeacherAvailable(teacherId, slotStart, slotEnd)
        
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available,
        })
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return slots
}

// ==========================================
// CALENDAR SYNC
// ==========================================

/**
 * Generate iCalendar format for lessons
 * Used for calendar imports
 */
export function generateICalendar(lessons: Array<{
  id: string
  title: string
  scheduledAt: Date
  duration: number
  teacher: { name: string; email: string }
  student: { name: string; email: string }
}>): string {
  
  const icalLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skill Exchange Platform//EN',
    'CALSCALE:GREGORIAN',
  ]
  
  for (const lesson of lessons) {
    const start = lesson.scheduledAt
    const end = new Date(start.getTime() + lesson.duration * 60000)
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }
    
    icalLines.push(
      'BEGIN:VEVENT',
      `UID:${lesson.id}@skillexchange.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${lesson.title}`,
      `DESCRIPTION:Lesson with ${lesson.teacher.name}`,
      `ORGANIZER;CN=${lesson.teacher.name}:mailto:${lesson.teacher.email}`,
      `ATTENDEE;CN=${lesson.student.name}:mailto:${lesson.student.email}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    )
  }
  
  icalLines.push('END:VCALENDAR')
  
  return icalLines.join('\r\n')
}

// ==========================================
// TIMEZONE CONVERSION
// ==========================================

/**
 * Convert time from one timezone to another
 * @param date - Date to convert
 * @param fromTimezone - Source timezone
 * @param toTimezone - Target timezone
 */
export function convertTimezone(
  date: Date,
  fromTimezone: string,
  toTimezone: string
): Date {
  // Use Intl API for timezone conversion
  const options: Intl.DateTimeFormatOptions = {
    timeZone: toTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }
  
  const formatter = new Intl.DateTimeFormat('en-US', options)
  const parts = formatter.formatToParts(date)
  
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
  
  return new Date(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  )
}

// ==========================================
// BOOKING VALIDATION
// ==========================================

/**
 * Validate booking request
 */
export async function validateBooking(
  teacherId: string,
  startTime: Date,
  duration: number
): Promise<{ valid: boolean; errors: string[] }> {
  
  const errors: string[] = []
  const endTime = new Date(startTime.getTime() + duration * 60000)
  
  // 1. Check if time is in the past
  if (startTime < new Date()) {
    errors.push('Cannot book lessons in the past')
  }
  
  // 2. Check teacher availability
  const { available, reason } = await isTeacherAvailable(teacherId, startTime, endTime)
  if (!available) {
    errors.push(reason || 'Teacher not available')
  }
  
  // 3. Check allowed durations
  const settings = await prisma.bookingSettings.findUnique({
    where: { userId: teacherId },
  })
  
  if (settings && !settings.allowedDurations.includes(duration)) {
    errors.push(`Duration must be one of: ${settings.allowedDurations.join(', ')} minutes`)
  }
  
  // 4. Check if it's a reasonable time (e.g., not at 3 AM)
  const hour = startTime.getHours()
  if (hour < 6 || hour > 23) {
    errors.push('Please select a time between 6 AM and 11 PM')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}