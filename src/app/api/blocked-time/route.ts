/**
 * BLOCKED TIME API
 * 
 * Teachers can block specific times when they're unavailable
 * (vacations, holidays, personal time, etc.)
 * 
 * POST /api/blocked-time - Block a time period
 * GET /api/blocked-time - Get blocked times
 * DELETE /api/blocked-time - Remove blocked time
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// ==========================================
// VALIDATION
// ==========================================

const blockTimeSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string().max(200).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
})

/**
 * POST - Block a time period
 * 
 * Example:
 * POST /api/blocked-time
 * {
 *   "startTime": "2026-01-20T00:00:00Z",
 *   "endTime": "2026-01-25T23:59:59Z",
 *   "reason": "Vacation",
 *   "isRecurring": false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse and validate
    const body = await request.json()
    const validatedData = blockTimeSchema.parse(body)
    
    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)
    
    // 3. Validate time range
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }
    
    if (startTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot block time in the past' },
        { status: 400 }
      )
    }
    
    // 4. Check for existing lessons in this time period
    const conflictingLessons = await prisma.lesson.findMany({
      where: {
        teacherId: currentUser.userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledAt: {
          gte: startTime,
          lt: endTime,
        },
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        student: {
          select: { name: true },
        },
      },
    })
    
    if (conflictingLessons.length > 0) {
      return NextResponse.json({
        error: 'Cannot block time with existing lessons',
        conflictingLessons: conflictingLessons.map(l => ({
          id: l.id,
          title: l.title,
          studentName: l.student.name,
          scheduledAt: l.scheduledAt,
        })),
      }, { status: 400 })
    }
    
    // 5. Create blocked time
    const blockedTime = await prisma.blockedTime.create({
      data: {
        userId: currentUser.userId,
        startTime,
        endTime,
        reason: validatedData.reason,
        isRecurring: validatedData.isRecurring || false,
        recurrenceRule: validatedData.recurrenceRule,
      },
    })
    
    return NextResponse.json({
      message: 'Time blocked successfully',
      blockedTime,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Block time error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to block time' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get blocked times
 * 
 * Query params:
 * - userId: string (optional, defaults to current user)
 * - startDate: string (optional, filter from date)
 * - endDate: string (optional, filter to date)
 * 
 * Example: GET /api/blocked-time?startDate=2026-01-01&endDate=2026-12-31
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    // If userId not provided, must be authenticated
    let targetUserId = userId
    if (!userId) {
      const currentUser = requireAuth(request)
      targetUserId = currentUser.userId
    }
    
    // Build query
    const where: any = { userId: targetUserId }
    
    if (startDateParam || endDateParam) {
      where.OR = []
      
      if (startDateParam) {
        where.OR.push({
          endTime: { gte: new Date(startDateParam) },
        })
      }
      
      if (endDateParam) {
        where.OR.push({
          startTime: { lte: new Date(endDateParam) },
        })
      }
    }
    
    // Fetch blocked times
    const blockedTimes = await prisma.blockedTime.findMany({
      where,
      orderBy: { startTime: 'asc' },
    })
    
    // Group by month for calendar view
    const byMonth: Record<string, any[]> = {}
    
    for (const block of blockedTimes) {
      const monthKey = block.startTime.toISOString().substring(0, 7) // "2026-01"
      
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = []
      }
      
      byMonth[monthKey].push({
        id: block.id,
        startTime: block.startTime.toISOString(),
        endTime: block.endTime.toISOString(),
        reason: block.reason,
        isRecurring: block.isRecurring,
        durationDays: Math.ceil(
          (block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })
    }
    
    return NextResponse.json({
      blockedTimes,
      byMonth,
      total: blockedTimes.length,
    })
    
  } catch (error: any) {
    console.error('Get blocked times error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch blocked times' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove blocked time
 * 
 * Example: DELETE /api/blocked-time?id=uuid
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Get ID
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Blocked time ID required' },
        { status: 400 }
      )
    }
    
    // 3. Verify ownership
    const existing = await prisma.blockedTime.findUnique({
      where: { id },
    })
    
    if (!existing || existing.userId !== currentUser.userId) {
      return NextResponse.json(
        { error: 'Blocked time not found' },
        { status: 404 }
      )
    }
    
    // 4. Delete
    await prisma.blockedTime.delete({
      where: { id },
    })
    
    return NextResponse.json({
      message: 'Blocked time removed successfully',
    })
    
  } catch (error: any) {
    console.error('Delete blocked time error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to remove blocked time' },
      { status: 500 }
    )
  }
}