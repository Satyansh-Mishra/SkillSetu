/**
 * BOOKING SETTINGS API
 * 
 * Teachers configure their booking preferences:
 * - Buffer time between lessons
 * - Advance booking requirements
 * - Allowed lesson durations
 * - Auto-accept bookings
 * - Cancellation policy
 * 
 * GET /api/booking-settings - Get settings
 * POST /api/booking-settings - Create/update settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// ==========================================
// VALIDATION
// ==========================================

const bookingSettingsSchema = z.object({
  bufferMinutes: z.number().int().min(0).max(60).optional(),
  minAdvanceHours: z.number().int().min(1).max(168).optional(), // Max 1 week
  maxAdvanceDays: z.number().int().min(1).max(365).optional(),
  allowedDurations: z.array(z.number().int().positive()).optional(),
  autoAccept: z.boolean().optional(),
  cancellationHours: z.number().int().min(1).max(168).optional(),
})

/**
 * GET - Get booking settings
 * 
 * Query params:
 * - userId: string (optional, defaults to current user)
 * 
 * Example: GET /api/booking-settings?userId=uuid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // If userId not provided, must be authenticated
    let targetUserId = userId as string
    if (!userId) {
      const currentUser = requireAuth(request)
      targetUserId = currentUser.userId
    }
    
    // Fetch settings
    let settings = await prisma.bookingSettings.findUnique({
      where: { userId: targetUserId },
    })
    
    // If no settings exist, return defaults
    if (!settings) {
      settings = {
        id: '',
        userId: targetUserId,
        bufferMinutes: 15,
        minAdvanceHours: 24,
        maxAdvanceDays: 90,
        allowedDurations: [30, 60, 90, 120],
        autoAccept: false,
        cancellationHours: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
    
    return NextResponse.json({
      settings,
      explanation: {
        bufferMinutes: 'Break time between lessons',
        minAdvanceHours: 'Minimum hours before lesson can be booked',
        maxAdvanceDays: 'Maximum days in advance for booking',
        allowedDurations: 'Allowed lesson durations in minutes',
        autoAccept: 'Automatically accept booking requests',
        cancellationHours: 'Hours before lesson for free cancellation',
      },
    })
    
  } catch (error: any) {
    console.error('Get booking settings error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch booking settings' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create or update booking settings
 * 
 * Example:
 * POST /api/booking-settings
 * {
 *   "bufferMinutes": 30,
 *   "minAdvanceHours": 48,
 *   "maxAdvanceDays": 60,
 *   "allowedDurations": [60, 90, 120],
 *   "autoAccept": true,
 *   "cancellationHours": 48
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse and validate
    const body = await request.json()
    const validatedData = bookingSettingsSchema.parse(body)
    
    // 3. Validate allowed durations
    if (validatedData.allowedDurations) {
      if (validatedData.allowedDurations.length === 0) {
        return NextResponse.json(
          { error: 'Must allow at least one lesson duration' },
          { status: 400 }
        )
      }
      
      // Check all durations are reasonable (15 min to 4 hours)
      for (const duration of validatedData.allowedDurations) {
        if (duration < 15 || duration > 240) {
          return NextResponse.json(
            { error: 'Durations must be between 15 and 240 minutes' },
            { status: 400 }
          )
        }
      }
    }
    
    // 4. Upsert settings
    const settings = await prisma.bookingSettings.upsert({
      where: { userId: currentUser.userId },
      update: validatedData,
      create: {
        userId: currentUser.userId,
        ...validatedData,
      },
    })
    
    return NextResponse.json({
      message: 'Booking settings updated successfully',
      settings,
    })
    
  } catch (error: any) {
    console.error('Update booking settings error:', error)
    
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
      { error: 'Failed to update booking settings' },
      { status: 500 }
    )
  }
}