/**
 * SKILLS MANAGEMENT ENDPOINTS
 * 
 * GET /api/skills - Get all skills (with search & filter)
 * POST /api/skills - Create a new skill (admin/teacher)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { validate, createSkillSchema } from '@/lib/validators'

/**
 * GET - Get all skills with search and filters
 * 
 * Query params:
 * - search: string (search in name/description)
 * - category: string (filter by category)
 * - page: number
 * - limit: number
 * 
 * Example: GET /api/skills?search=python&category=Programming&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // 2. Build search query
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (category) {
      where.category = category
    }
    
    // 3. Fetch skills with pagination
    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        include: {
          _count: {
            select: {
              teachers: true,
              students: true,
              lessons: true,
            },
          },
        },
        orderBy: [
          { name: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.skill.count({ where }),
    ])
    
    // 4. Enhance skills with additional data
    const enhancedSkills = await Promise.all(
      skills.map(async (skill) => {
        // Get average rating for this skill
        const reviews = await prisma.review.findMany({
          where: {
            lesson: {
              skillId: skill.id,
            },
          },
          select: { rating: true },
        })
        
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0
        
        // Get average hourly rate for teachers of this skill
        const teachers = await prisma.user.findMany({
          where: {
            skillsToTeach: {
              some: { id: skill.id },
            },
            hourlyRate: { not: null },
          },
          select: { hourlyRate: true },
        })
        
        const avgRate = teachers.length > 0
          ? teachers.reduce((sum, t) => sum + (t.hourlyRate || 0), 0) / teachers.length
          : 0
        
        return {
          ...skill,
          stats: {
            totalTeachers: skill._count.teachers,
            totalStudents: skill._count.students,
            totalLessons: skill._count.lessons,
            averageRating: Number(avgRating.toFixed(1)),
            averageHourlyRate: Number(avgRate.toFixed(2)),
          },
        }
      })
    )
    
    // 5. Get all unique categories for filtering
    const categories = await prisma.skill.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })
    
    return NextResponse.json({
      skills: enhancedSkills,
      categories: categories.map(c => c.category),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
    
  } catch (error: any) {
    console.error('Get skills error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new skill
 * 
 * Example request:
 * POST /api/skills
 * Headers: Authorization: Bearer <token>
 * {
 *   "name": "Python Programming",
 *   "category": "Programming",
 *   "description": "Learn Python from scratch"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Parse and validate request
    const body = await request.json()
    const validatedData = validate(createSkillSchema, body)
    
    // 3. Check if skill already exists
    const existingSkill = await prisma.skill.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
        category: validatedData.category,
      },
    })
    
    if (existingSkill) {
      return NextResponse.json(
        { error: 'Skill already exists', skill: existingSkill },
        { status: 400 }
      )
    }
    
    // 4. Create skill
    const skill = await prisma.skill.create({
      data: validatedData,
    })
    
    return NextResponse.json({
      message: 'Skill created successfully',
      skill,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Create skill error:', error)
    
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
      { error: 'Failed to create skill' },
      { status: 500 }
    )
  }
}