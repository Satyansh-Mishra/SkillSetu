/**
 * REVIEW MANAGEMENT ENDPOINTS
 * 
 * POST /api/reviews - Create a review
 * GET /api/reviews - Get reviews for a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { validate, createReviewSchema } from '@/lib/validators'

/**
 * POST - Create a review after lesson
 * 
 * Example request:
 * POST /api/reviews
 * {
 *   "lessonId": "uuid",
 *   "rating": 5,
 *   "knowledge": 5,
 *   "clarity": 5,
 *   "patience": 5,
 *   "timing": 4,
 *   "comment": "Excellent teacher!"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse and validate request
    const body = await request.json()
    const validatedData = validate(createReviewSchema, body)
    
    // 3. Fetch lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: validatedData.lessonId },
      include: {
        review: true,
        payment: true,
      },
    })
    
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }
    
    // 4. Verify user is part of the lesson
    const isStudent = lesson.studentId === currentUser.userId
    const isTeacher = lesson.teacherId === currentUser.userId
    
    if (!isStudent && !isTeacher) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // 5. Check if lesson is completed
    if (lesson.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only review completed lessons' },
        { status: 400 }
      )
    }
    
    // 6. Check if review already exists
    if (lesson.review) {
      return NextResponse.json(
        { error: 'Review already submitted' },
        { status: 400 }
      )
    }
    
    // 7. Determine who is being reviewed
    const giverId = currentUser.userId
    const receiverId = isStudent ? lesson.teacherId : lesson.studentId
    
    // 8. Create review
    const review = await prisma.review.create({
      data: {
        lessonId: validatedData.lessonId,
        giverId,
        receiverId,
        rating: validatedData.rating,
        knowledge: validatedData.knowledge,
        clarity: validatedData.clarity,
        patience: validatedData.patience,
        timing: validatedData.timing,
        comment: validatedData.comment,
        isVerified: lesson.payment?.status === 'COMPLETED',
      },
      include: {
        giver: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        lesson: {
          select: {
            title: true,
            scheduledAt: true,
          },
        },
      },
    })
    
    // 9. Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'REVIEW_RECEIVED',
        title: 'New Review',
        message: `You received a ${validatedData.rating}-star review`,
        link: `/reviews/${review.id}`,
      },
    })
    
    // 10. Award badge if milestone reached
    const reviewCount = await prisma.review.count({
      where: { receiverId },
    })
    
    if (reviewCount === 10) {
      // Award "10 Reviews" badge
      const badge = await prisma.badge.findFirst({
        where: { name: '10 Reviews' },
      })
      
      if (badge) {
        await prisma.userBadge.create({
          data: {
            userId: receiverId,
            badgeId: badge.id,
          },
        })
      }
    }
    
    return NextResponse.json({
      message: 'Review submitted successfully',
      review,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Create review error:', error)
    
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
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get reviews for a user
 * 
 * Query params:
 * - userId: string (required)
 * - page: number
 * - limit: number
 * 
 * Example: GET /api/reviews?userId=abc123&page=1&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }
    
    // 2. Fetch reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { receiverId: userId },
        include: {
          giver: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          lesson: {
            select: {
              title: true,
              scheduledAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { receiverId: userId } }),
    ])
    
    // 3. Calculate statistics
    const stats = await prisma.review.aggregate({
      where: { receiverId: userId },
      _avg: {
        rating: true,
        knowledge: true,
        clarity: true,
        patience: true,
        timing: true,
      },
    })
    
    return NextResponse.json({
      reviews,
      stats: {
        averageRating: Number((stats._avg.rating || 0).toFixed(1)),
        averageKnowledge: Number((stats._avg.knowledge || 0).toFixed(1)),
        averageClarity: Number((stats._avg.clarity || 0).toFixed(1)),
        averagePatience: Number((stats._avg.patience || 0).toFixed(1)),
        averageTiming: Number((stats._avg.timing || 0).toFixed(1)),
        totalReviews: total,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
    
  } catch (error: any) {
    console.error('Get reviews error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}