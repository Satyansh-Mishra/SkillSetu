/**
 * CURRENT USER ENDPOINT
 * 
 * GET /api/users/me
 * Returns current logged-in user's profile
 * 
 * PUT /api/users/me
 * Updates current user's profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { validate, updateProfileSchema } from '@/lib/validators'

/**
 * GET current user profile
 * 
 * Example request:
 * GET /api/users/me
 * Headers: Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profileImage: true,
        role: true,
        phone: true,
        location: true,
        timezone: true,
        hourlyRate: true,
        experience: true,
        verified: true,
        createdAt: true,
        // Include skills
        skillsToTeach: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        skillsToLearn: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        // Include stats
        _count: {
          select: {
            teacherLessons: true,
            studentLessons: true,
            reviewsReceived: true,
          },
        },
      },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // 3. Calculate average rating
    const reviews = await prisma.review.findMany({
      where: { receiverId: user.id },
      select: { rating: true },
    })
    
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
    
    return NextResponse.json({
      ...user,
      stats: {
        lessonsAsTeacher: user._count.teacherLessons,
        lessonsAsStudent: user._count.studentLessons,
        totalReviews: user._count.reviewsReceived,
        averageRating: Number(averageRating.toFixed(1)),
      },
    })
    
  } catch (error: any) {
    console.error('Get user error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/**
 * UPDATE current user profile
 * 
 * Example request:
 * PUT /api/users/me
 * Headers: Authorization: Bearer <token>
 * Body: { "name": "New Name", "bio": "My bio" }
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse and validate request
    const body = await request.json()
    const validatedData = validate(updateProfileSchema, body)
    
    // 3. Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profileImage: true,
        role: true,
        phone: true,
        location: true,
        timezone: true,
        hourlyRate: true,
        experience: true,
      },
    })
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })
    
  } catch (error: any) {
    console.error('Update user error:', error)
    
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
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}