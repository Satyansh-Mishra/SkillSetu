/**
 * LESSON MANAGEMENT ENDPOINTS
 * 
 * POST /api/lessons - Book a new lesson
 * GET /api/lessons - Get user's lessons
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { validate, bookLessonSchema } from '@/lib/validators'

/**
 * POST - Book a new lesson
 * 
 * Example request:
 * POST /api/lessons
 * {
 *   "teacherId": "uuid",
 *   "skillId": "uuid",
 *   "title": "Learn Python Basics",
 *   "scheduledAt": "2026-01-15T18:00:00Z",
 *   "duration": 60,
 *   "price": 500
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse and validate request
    const body = await request.json()
    const validatedData = validate(bookLessonSchema, body)
    
    // 3. Verify teacher exists and is available
    const teacher = await prisma.user.findUnique({
      where: { id: validatedData.teacherId },
    })
    
    if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'BOTH')) {
      return NextResponse.json(
        { error: 'Invalid teacher' },
        { status: 400 }
      )
    }
    
    // 4. Check if time slot is available
    const scheduledDate = new Date(validatedData.scheduledAt)
    const endTime = new Date(scheduledDate.getTime() + validatedData.duration * 60000)
    
    const conflictingLesson = await prisma.lesson.findFirst({
      where: {
        teacherId: validatedData.teacherId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledAt: {
          gte: scheduledDate,
          lt: endTime,
        },
      },
    })
    
    if (conflictingLesson) {
      return NextResponse.json(
        { error: 'Teacher is not available at this time' },
        { status: 400 }
      )
    }
    
    // 5. Create lesson booking
    const lesson = await prisma.lesson.create({
      data: {
        teacherId: validatedData.teacherId,
        studentId: currentUser.userId,
        skillId: validatedData.skillId,
        title: validatedData.title,
        description: validatedData.description,
        scheduledAt: scheduledDate,
        duration: validatedData.duration,
        price: validatedData.price,
        status: 'PENDING',
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        skill: true,
      },
    })
    
    // 6. Create notification for teacher
    await prisma.notification.create({
      data: {
        userId: validatedData.teacherId,
        type: 'LESSON_BOOKED',
        title: 'New Lesson Request',
        message: `${teacher.name} wants to book a lesson with you`,
        link: `/lessons/${lesson.id}`,
      },
    })
    
    // TODO: Send email notification
    
    return NextResponse.json({
      message: 'Lesson booked successfully',
      lesson,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Book lesson error:', error)
    
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
      { error: 'Failed to book lesson' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get user's lessons
 * 
 * Query params:
 * - role: "teacher" | "student" (filter by role)
 * - status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
 * - page: number (pagination)
 * - limit: number (items per page)
 * 
 * Example: GET /api/lessons?role=student&status=CONFIRMED&page=1&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // "teacher" or "student"
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // 3. Build query
    const where: any = {}
    
    if (role === 'teacher') {
      where.teacherId = currentUser.userId
    } else if (role === 'student') {
      where.studentId = currentUser.userId
    } else {
      // Show all lessons (both as teacher and student)
      where.OR = [
        { teacherId: currentUser.userId },
        { studentId: currentUser.userId },
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    // 4. Fetch lessons with pagination
    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
          skill: true,
          payment: {
            select: {
              status: true,
              amount: true,
            },
          },
          review: {
            select: {
              rating: true,
              comment: true,
            },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lesson.count({ where }),
    ])
    
    return NextResponse.json({
      lessons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
    
  } catch (error: any) {
    console.error('Get lessons error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}