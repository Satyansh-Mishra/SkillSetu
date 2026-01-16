/**
 * TIME SLOTS API
 * 
 * GET /api/timeslots - Get available time slots for a teacher
 * 
 * This generates bookable time slots based on:
 * - Teacher's availability schedule
 * - Existing bookings
 * - Blocked times
 * - Booking settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateTimeSlots, getDayName } from '@/lib/availability'

/**
 * GET - Get available time slots
 * 
 * Query params:
 * - teacherId: string (required)
 * - startDate: string (ISO date, default: today)
 * - endDate: string (ISO date, default: +7 days)
 * - duration: number (minutes, default: 60)
 * 
 * Example: GET /api/timeslots?teacherId=uuid&startDate=2026-01-15&duration=60
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const duration = parseInt(searchParams.get('duration') || '60')
    
    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId required' },
        { status: 400 }
      )
    }
    
    // Parse dates
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date()
    
    const endDate = endDateParam 
      ? new Date(endDateParam)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 days
    
    // 2. Verify teacher exists
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        timezone: true,
        hourlyRate: true,
      },
    })
    
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }
    
    // 3. Generate time slots
    const slots = await generateTimeSlots(teacherId, startDate, endDate, duration)
    
    // 4. Group slots by date
    const slotsByDate: Record<string, any[]> = {}
    
    for (const slot of slots) {
      const dateKey = slot.startTime.toISOString().split('T')[0]
      
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = []
      }
      
      slotsByDate[dateKey].push({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        available: slot.available,
        price: teacher.hourlyRate ? (teacher.hourlyRate * duration) / 60 : null,
        duration,
      })
    }
    
    // 5. Create summary
    const totalSlots = slots.length
    const availableSlots = slots.filter(s => s.available).length
    
    // Get next available slot
    const nextAvailable = slots.find(s => s.available)
    
    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        timezone: teacher.timezone,
        hourlyRate: teacher.hourlyRate,
      },
      summary: {
        totalSlots,
        availableSlots,
        bookedSlots: totalSlots - availableSlots,
        nextAvailable: nextAvailable ? {
          date: nextAvailable.startTime.toISOString().split('T')[0],
          time: nextAvailable.startTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          dayOfWeek: getDayName(nextAvailable.startTime.getDay()),
        } : null,
      },
      slots: slotsByDate,
      duration,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
    })
    
  } catch (error: any) {
    console.error('Get time slots error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    )
  }
}