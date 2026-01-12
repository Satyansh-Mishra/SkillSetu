/**
 * SKILL STATISTICS & ANALYTICS
 * 
 * GET /api/skills/[id]/stats
 * 
 * Returns detailed statistics about a skill:
 * - Popularity trends
 * - Average ratings
 * - Price insights
 * - Demand patterns
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET - Get comprehensive skill statistics
 * 
 * Example: GET /api/skills/uuid/stats
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: skillId } = params
    
    // 1. Verify skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,
            lessons: true,
          },
        },
      },
    })
    
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }
    
    // 2. Get pricing data
    const teachers = await prisma.user.findMany({
      where: {
        skillsToTeach: {
          some: { id: skillId },
        },
        hourlyRate: { not: null },
      },
      select: { hourlyRate: true },
    })
    
    const prices = teachers.map(t => t.hourlyRate!).filter(p => p > 0)
    const avgPrice = prices.length > 0
      ? prices.reduce((sum, p) => sum + p, 0) / prices.length
      : 0
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    
    // 3. Get rating data
    const reviews = await prisma.review.findMany({
      where: {
        lesson: {
          skillId: skillId,
        },
      },
      select: {
        rating: true,
        knowledge: true,
        clarity: true,
        patience: true,
        createdAt: true,
      },
    })
    
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
    
    const avgKnowledge = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.knowledge || 0), 0) / reviews.length
      : 0
    
    const avgClarity = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.clarity || 0), 0) / reviews.length
      : 0
    
    // 4. Calculate popularity trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - i)
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      
      const lessonsCount = await prisma.lesson.count({
        where: {
          skillId: skillId,
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      })
      
      monthlyData.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        lessons: lessonsCount,
      })
    }
    
    // 5. Get completion rate
    const completedLessons = await prisma.lesson.count({
      where: {
        skillId: skillId,
        status: 'COMPLETED',
      },
    })
    
    const totalLessons = skill._count.lessons
    const completionRate = totalLessons > 0
      ? (completedLessons / totalLessons) * 100
      : 0
    
    // 6. Get busiest days/times
    const allLessons = await prisma.lesson.findMany({
      where: { skillId: skillId },
      select: { scheduledAt: true },
    })
    
    const dayCount: Record<number, number> = {}
    const hourCount: Record<number, number> = {}
    
    for (const lesson of allLessons) {
      const day = lesson.scheduledAt.getDay()
      const hour = lesson.scheduledAt.getHours()
      dayCount[day] = (dayCount[day] || 0) + 1
      hourCount[hour] = (hourCount[hour] || 0) + 1
    }
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const busiestDay = Object.keys(dayCount).length > 0
      ? daysOfWeek[parseInt(Object.keys(dayCount).reduce((a, b) => dayCount[parseInt(a)] > dayCount[parseInt(b)] ? a : b))]
      : 'N/A'
    
    const busiestHour = Object.keys(hourCount).length > 0
      ? parseInt(Object.keys(hourCount).reduce((a, b) => hourCount[parseInt(a)] > hourCount[parseInt(b)] ? a : b))
      : 0
    
    // 7. Get top teachers
    const topTeachers = await prisma.user.findMany({
      where: {
        skillsToTeach: {
          some: { id: skillId },
        },
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        hourlyRate: true,
        _count: {
          select: {
            teacherLessons: {
              where: {
                skillId: skillId,
                status: 'COMPLETED',
              },
            },
          },
        },
      },
      orderBy: {
        teacherLessons: {
          _count: 'desc',
        },
      },
      take: 5,
    })
    
    const topTeachersWithRatings = await Promise.all(
      topTeachers.map(async (teacher) => {
        const reviews = await prisma.review.findMany({
          where: {
            receiverId: teacher.id,
            lesson: {
              skillId: skillId,
            },
          },
          select: { rating: true },
        })
        
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0
        
        return {
          ...teacher,
          lessonsTaught: teacher._count.teacherLessons,
          averageRating: Number(avgRating.toFixed(1)),
        }
      })
    )
    
    // 8. Return comprehensive statistics
    return NextResponse.json({
      skill: {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        description: skill.description,
      },
      overview: {
        totalTeachers: skill._count.teachers,
        totalStudents: skill._count.students,
        totalLessons: skill._count.lessons,
        completionRate: Number(completionRate.toFixed(1)),
      },
      ratings: {
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews: reviews.length,
        breakdown: {
          knowledge: Number(avgKnowledge.toFixed(1)),
          clarity: Number(avgClarity.toFixed(1)),
        },
      },
      pricing: {
        average: Number(avgPrice.toFixed(2)),
        minimum: minPrice,
        maximum: maxPrice,
        currency: 'INR',
      },
      popularity: {
        trend: monthlyData,
        busiestDay,
        busiestHour: `${busiestHour}:00 - ${busiestHour + 1}:00`,
      },
      topTeachers: topTeachersWithRatings,
    })
    
  } catch (error: any) {
    console.error('Get skill stats error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch skill statistics' },
      { status: 500 }
    )
  }
}