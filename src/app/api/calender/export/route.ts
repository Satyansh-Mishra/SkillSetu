/**
 * CALENDAR EXPORT API
 * 
 * Export lessons to iCalendar format (.ics file)
 * Compatible with Google Calendar, Apple Calendar, Outlook, etc.
 * 
 * GET /api/calendar/export - Export user's lessons
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { generateICalendar } from '@/lib/availability'

/**
 * GET - Export lessons to iCalendar format
 * 
 * Query params:
 * - role: "teacher" | "student" (optional, default: both)
 * - startDate: string (optional, default: today)
 * - endDate: string (optional, default: +30 days)
 * 
 * Example: GET /api/calendar/export?role=teacher
 * 
 * Returns: .ics file download
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    const startDate = startDateParam 
      ? new Date(startDateParam)
      : new Date()
    
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
    
    // 3. Build query
    const where: any = {
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
    }
    
    if (role === 'teacher') {
      where.teacherId = currentUser.userId
    } else if (role === 'student') {
      where.studentId = currentUser.userId
    } else {
      where.OR = [
        { teacherId: currentUser.userId },
        { studentId: currentUser.userId },
      ]
    }
    
    // 4. Fetch lessons
    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        skill: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    })
    
    // 5. Generate iCalendar content
    const icalContent = generateICalendar(
      lessons.map(lesson => ({
        id: lesson.id,
        title: `${lesson.skill.name}: ${lesson.title}`,
        scheduledAt: lesson.scheduledAt,
        duration: lesson.duration,
        teacher: lesson.teacher,
        student: lesson.student,
      }))
    )
    
    // 6. Return as downloadable file
    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="lessons.ics"',
      },
    })
    
  } catch (error: any) {
    console.error('Calendar export error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to export calendar' },
      { status: 500 }
    )
  }
}