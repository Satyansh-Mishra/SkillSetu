/**
 * USER SKILLS MANAGEMENT
 * 
 * GET /api/users/me/skills - Get current user's skills
 * POST /api/users/me/skills - Add skill to user profile
 * DELETE /api/users/me/skills - Remove skill from user profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

/**
 * GET - Get current user's skills
 * 
 * Returns:
 * - Skills user can teach
 * - Skills user wants to learn
 * 
 * Example: GET /api/users/me/skills
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Fetch user with skills
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        skillsToTeach: {
          include: {
            _count: {
              select: {
                lessons: true,
                teachers: true,
              },
            },
          },
        },
        skillsToLearn: {
          include: {
            _count: {
              select: {
                lessons: true,
                students: true,
              },
            },
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
    
    // 3. Get statistics for each teaching skill
    const teachingSkillsWithStats = await Promise.all(
      user.skillsToTeach.map(async (skill) => {
        // Count lessons taught for this skill
        const lessonsTaught = await prisma.lesson.count({
          where: {
            teacherId: currentUser.userId,
            skillId: skill.id,
            status: 'COMPLETED',
          },
        })
        
        // Get average rating for this skill
        const reviews = await prisma.review.findMany({
          where: {
            receiverId: currentUser.userId,
            lesson: {
              skillId: skill.id,
            },
          },
          select: { rating: true },
        })
        
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0
        
        return {
          ...skill,
          myStats: {
            lessonsTaught,
            totalReviews: reviews.length,
            averageRating: Number(avgRating.toFixed(1)),
          },
        }
      })
    )
    
    // 4. Get statistics for learning skills
    const learningSkillsWithStats = await Promise.all(
      user.skillsToLearn.map(async (skill) => {
        // Count lessons taken for this skill
        const lessonsTaken = await prisma.lesson.count({
          where: {
            studentId: currentUser.userId,
            skillId: skill.id,
            status: 'COMPLETED',
          },
        })
        
        // Calculate progress (arbitrary: 10 lessons = 100%)
        const progress = Math.min((lessonsTaken / 10) * 100, 100)
        
        return {
          ...skill,
          myStats: {
            lessonsTaken,
            progress: Number(progress.toFixed(0)),
          },
        }
      })
    )
    
    return NextResponse.json({
      teaching: teachingSkillsWithStats,
      learning: learningSkillsWithStats,
    })
    
  } catch (error: any) {
    console.error('Get user skills error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

/**
 * POST - Add skill to user profile
 * 
 * Example request:
 * POST /api/users/me/skills
 * {
 *   "skillId": "uuid",
 *   "type": "teach" | "learn"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse request
    const { skillId, type } = await request.json()
    
    if (!skillId || !['teach', 'learn'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide skillId and type (teach/learn)' },
        { status: 400 }
      )
    }
    
    // 3. Verify skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    })
    
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }
    
    // 4. Check if already added
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        skillsToTeach: { where: { id: skillId } },
        skillsToLearn: { where: { id: skillId } },
      },
    })
    
    if (type === 'teach' && user?.skillsToTeach.length) {
      return NextResponse.json(
        { error: 'Skill already in teaching list' },
        { status: 400 }
      )
    }
    
    if (type === 'learn' && user?.skillsToLearn.length) {
      return NextResponse.json(
        { error: 'Skill already in learning list' },
        { status: 400 }
      )
    }
    
    // 5. Add skill to user
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        ...(type === 'teach' && {
          skillsToTeach: {
            connect: { id: skillId },
          },
          // Update role if not already a teacher
          role: user?.skillsToTeach.length === 0 ? 'BOTH' : undefined,
        }),
        ...(type === 'learn' && {
          skillsToLearn: {
            connect: { id: skillId },
          },
        }),
      },
      select: {
        id: true,
        role: true,
        skillsToTeach: true,
        skillsToLearn: true,
      },
    })
    
    return NextResponse.json({
      message: `Skill added to ${type === 'teach' ? 'teaching' : 'learning'} list`,
      user: updatedUser,
    })
    
  } catch (error: any) {
    console.error('Add skill error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to add skill' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove skill from user profile
 * 
 * Example request:
 * DELETE /api/users/me/skills
 * {
 *   "skillId": "uuid",
 *   "type": "teach" | "learn"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse request
    const { skillId, type } = await request.json()
    
    if (!skillId || !['teach', 'learn'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide skillId and type (teach/learn)' },
        { status: 400 }
      )
    }
    
    // 3. Remove skill from user
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        ...(type === 'teach' && {
          skillsToTeach: {
            disconnect: { id: skillId },
          },
        }),
        ...(type === 'learn' && {
          skillsToLearn: {
            disconnect: { id: skillId },
          },
        }),
      },
    })
    
    return NextResponse.json({
      message: `Skill removed from ${type === 'teach' ? 'teaching' : 'learning'} list`,
    })
    
  } catch (error: any) {
    console.error('Remove skill error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to remove skill' },
      { status: 500 }
    )
  }
}