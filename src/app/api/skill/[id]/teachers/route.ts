/**
 * FIND TEACHERS BY SKILL
 * 
 * GET /api/skills/[id]/teachers
 * 
 * Returns all teachers who can teach a specific skill
 * with ratings, availability, and pricing
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET - Find teachers for a skill
 * 
 * Query params:
 * - minRating: number (filter by minimum rating)
 * - maxPrice: number (filter by maximum hourly rate)
 * - sortBy: "rating" | "price" | "experience" | "popularity"
 * - page: number
 * - limit: number
 * 
 * Example: GET /api/skills/uuid/teachers?minRating=4&maxPrice=1000&sortBy=rating
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: skillId } = params
    
    // 1. Parse query parameters
    const { searchParams } = new URL(request.url)
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
    const sortBy = searchParams.get('sortBy') || 'rating'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // 2. Verify skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    })
    
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }
    
    // 3. Find all teachers for this skill
    const teachers = await prisma.user.findMany({
      where: {
        skillsToTeach: {
          some: { id: skillId },
        },
        role: { in: ['TEACHER', 'BOTH'] },
        hourlyRate: {
          lte: maxPrice,
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profileImage: true,
        location: true,
        timezone: true,
        hourlyRate: true,
        experience: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            teacherLessons: true,
            reviewsReceived: true,
          },
        },
        availability: {
          where: { isAvailable: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })
    
    // 4. Enhance with ratings and stats
    const enhancedTeachers = await Promise.all(
      teachers.map(async (teacher) => {
        // Get reviews
        const reviews = await prisma.review.findMany({
          where: {
            receiverId: teacher.id,
            lesson: {
              skillId: skillId,
            },
          },
          select: {
            rating: true,
            knowledge: true,
            clarity: true,
            patience: true,
            timing: true,
          },
        })
        
        // Calculate average ratings
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0
        
        const avgKnowledge = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.knowledge || 0), 0) / reviews.length
          : 0
        
        const avgClarity = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.clarity || 0), 0) / reviews.length
          : 0
        
        // Count lessons taught for this skill
        const lessonsTaught = await prisma.lesson.count({
          where: {
            teacherId: teacher.id,
            skillId: skillId,
            status: 'COMPLETED',
          },
        })
        
        return {
          ...teacher,
          stats: {
            totalLessons: teacher._count.teacherLessons,
            lessonsTaughtForSkill: lessonsTaught,
            totalReviews: teacher._count.reviewsReceived,
            averageRating: Number(avgRating.toFixed(1)),
            averageKnowledge: Number(avgKnowledge.toFixed(1)),
            averageClarity: Number(avgClarity.toFixed(1)),
          },
          isAvailableNow: teacher.availability.length > 0,
        }
      })
    )
    
    // 5. Filter by minimum rating
    const filteredTeachers = enhancedTeachers.filter(
      t => t.stats.averageRating >= minRating
    )
    
    // 6. Sort teachers
    const sortedTeachers = filteredTeachers.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.stats.averageRating - a.stats.averageRating
        case 'price':
          return (a.hourlyRate || 0) - (b.hourlyRate || 0)
        case 'experience':
          return (b.experience || 0) - (a.experience || 0)
        case 'popularity':
          return b.stats.lessonsTaughtForSkill - a.stats.lessonsTaughtForSkill
        default:
          return b.stats.averageRating - a.stats.averageRating
      }
    })
    
    // 7. Paginate
    const startIndex = (page - 1) * limit
    const paginatedTeachers = sortedTeachers.slice(startIndex, startIndex + limit)
    
    return NextResponse.json({
      skill,
      teachers: paginatedTeachers,
      summary: {
        totalTeachers: filteredTeachers.length,
        averagePrice: filteredTeachers.length > 0
          ? filteredTeachers.reduce((sum, t) => sum + (t.hourlyRate || 0), 0) / filteredTeachers.length
          : 0,
        priceRange: {
          min: Math.min(...filteredTeachers.map(t => t.hourlyRate || 0)),
          max: Math.max(...filteredTeachers.map(t => t.hourlyRate || 0)),
        },
      },
      pagination: {
        total: filteredTeachers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredTeachers.length / limit),
      },
    })
    
  } catch (error: any) {
    console.error('Find teachers error:', error)
    
    return NextResponse.json(
      { error: 'Failed to find teachers' },
      { status: 500 }
    )
  }
}