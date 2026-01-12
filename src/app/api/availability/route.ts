/**
 * AVAILABILITY MANAGEMENT API
 * 
 * GET /api/availability - Get teacher's availability
 * POST /api/availability - Set availability schedule
 * PUT /api/availability - Update availability
 * DELETE /api/availability - Remove availability
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const createAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  isRecurring: z.boolean().optional(),
  timezone: z.string().optional(),
})

/**
 * GET - Get teacher's availability
 * 
 * Query params:
 * - userId: string (optional, defaults to current user)
 * 
 * Example: GET /api/availability?userId=uuid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // If userId not provided, must be authenticated
    let targetUserId = userId
    if (!userId) {
      const currentUser = requireAuth(request)
      targetUserId = currentUser.userId
    }
    
    // Fetch availability schedule
    const availabilities = await prisma.availability.findMany({
      where: { userId: targetUserId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    })
    
    // Group by day of week
    const schedule = {
      0: [], // Sunday
      1: [], // Monday
      2: [], // Tuesday
      3: [], // Wednesday
      4: [], // Thursday
      5: [], // Friday
      6: [], // Saturday
    } as Record<number, any[]>
    
    for (const avail of availabilities) {
      schedule[avail.dayOfWeek].push({
        id: avail.id,
        startTime: avail.startTime,
        endTime: avail.endTime,
        isAvailable: avail.isAvailable,
        isRecurring: avail.isRecurring,
        timezone: avail.timezone,
      })
    }
    
    // Get booking settings
    const settings = await prisma.bookingSettings.findUnique({
      where: { userId: targetUserId },
    })
    
    return NextResponse.json({
      schedule,
      settings: settings || {
        bufferMinutes: 15,
        minAdvanceHours: 24,
        maxAdvanceDays: 90,
        allowedDurations: [30, 60, 90, 120],
        autoAccept: false,
        cancellationHours: 24,
      },
    })
    
  } catch (error: any) {
    console.error('Get availability error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new availability slot
 * 
 * Example:
 * POST /api/availability
 * {
 *   "dayOfWeek": 1,
 *   "startTime": "09:00",
 *   "endTime": "17:00",
 *   "isRecurring": true,
 *   "timezone": "Asia/Kolkata"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse and validate request
    const body = await request.json()
    const validatedData = createAvailabilitySchema.parse(body)
    
    // 3. Validate time range
    const startMinutes = parseInt(validatedData.startTime.split(':')[0]) * 60 + 
                        parseInt(validatedData.startTime.split(':')[1])
    const endMinutes = parseInt(validatedData.endTime.split(':')[0]) * 60 + 
                      parseInt(validatedData.endTime.split(':')[1])
    
    if (startMinutes >= endMinutes) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }
    
    // 4. Check for overlapping availability
    const overlapping = await prisma.availability.findFirst({
      where: {
        userId: currentUser.userId,
        dayOfWeek: validatedData.dayOfWeek,
        OR: [
          {
            AND: [
              { startTime: { lte: validatedData.startTime } },
              { endTime: { gt: validatedData.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: validatedData.endTime } },
              { endTime: { gte: validatedData.endTime } },
            ],
          },
        ],
      },
    })
    
    if (overlapping) {
      return NextResponse.json(
        { error: 'Time slot overlaps with existing availability' },
        { status: 400 }
      )
    }
    
    // 5. Create availability
    const availability = await prisma.availability.create({
      data: {
        userId: currentUser.userId,
        dayOfWeek: validatedData.dayOfWeek,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        isRecurring: validatedData.isRecurring ?? true,
        timezone: validatedData.timezone || 'Asia/Kolkata',
      },
    })
    
    return NextResponse.json({
      message: 'Availability created successfully',
      availability,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Create availability error:', error)
    
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
      { error: 'Failed to create availability' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update availability
 * 
 * Example:
 * PUT /api/availability
 * {
 *   "id": "uuid",
 *   "startTime": "10:00",
 *   "endTime": "18:00",
 *   "isAvailable": true
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse request
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Availability ID required' },
        { status: 400 }
      )
    }
    
    // 3. Verify ownership
    const existing = await prisma.availability.findUnique({
      where: { id },
    })
    
    if (!existing || existing.userId !== currentUser.userId) {
      return NextResponse.json(
        { error: 'Availability not found' },
        { status: 404 }
      )
    }
    
    // 4. Update availability
    const updated = await prisma.availability.update({
      where: { id },
      data: updates,
    })
    
    return NextResponse.json({
      message: 'Availability updated successfully',
      availability: updated,
    })
    
  } catch (error: any) {
    console.error('Update availability error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove availability
 * 
 * Example: DELETE /api/availability?id=uuid
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Get ID from query
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Availability ID required' },
        { status: 400 }
      )
    }
    
    // 3. Verify ownership
    const existing = await prisma.availability.findUnique({
      where: { id },
    })
    
    if (!existing || existing.userId !== currentUser.userId) {
      return NextResponse.json(
        { error: 'Availability not found' },
        { status: 404 }
      )
    }
    
    // 4. Delete availability
    await prisma.availability.delete({
      where: { id },
    })
    
    return NextResponse.json({
      message: 'Availability deleted successfully',
    })
    
  } catch (error: any) {
    console.error('Delete availability error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete availability' },
      { status: 500 }
    )
  }
}