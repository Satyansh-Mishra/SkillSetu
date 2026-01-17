/**
 * AI-POWERED SKILL RECOMMENDATIONS
 * 
 * GET /api/skills/recommendations
 * 
 * Recommends skills based on:
 * - User's current skills
 * - Popular skill combinations
 * - Career pathways
 * - Trending skills
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

/**
 * Skill recommendation engine
 * This is a simplified version - in production, use ML algorithms
 */
class SkillRecommender {
  /**
   * Skill pathway data
   * Defines which skills naturally lead to others
   */
  private static skillPathways: Record<string, string[]> = {
    // Programming pathways
    'Python': ['Django', 'Flask', 'Machine Learning', 'Data Science', 'FastAPI'],
    'JavaScript': ['React', 'Node.js', 'TypeScript', 'Vue.js', 'Angular'],
    'HTML/CSS': ['JavaScript', 'React', 'Tailwind CSS', 'Web Design'],
    'React': ['Next.js', 'React Native', 'TypeScript', 'Redux'],
    'Java': ['Spring Boot', 'Android Development', 'Kotlin'],
    
    // Design pathways
    'Graphic Design': ['UI/UX Design', 'Figma', 'Adobe Illustrator', 'Branding'],
    'UI/UX Design': ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    
    // Music pathways
    'Guitar': ['Music Theory', 'Songwriting', 'Audio Production'],
    'Piano': ['Music Theory', 'Music Composition', 'Jazz'],
    
    // Business pathways
    'Marketing': ['Digital Marketing', 'SEO', 'Content Marketing', 'Social Media'],
    'Sales': ['Negotiation', 'Communication', 'CRM Software'],
    
    // Language pathways
    'Spanish': ['Portuguese', 'Italian', 'French'],
    'French': ['Spanish', 'Italian', 'Portuguese'],
  }
  
  /**
   * Get recommended skills for a user
   */
  static async getRecommendations(userId: string): Promise<any[]> {
    // 1. Get user's current skills
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        skillsToTeach: { select: { id: true, name: true, category: true } },
        skillsToLearn: { select: { id: true, name: true } },
      },
    })
    
    if (!user) return []
    
    const currentSkillNames = [
      ...user.skillsToTeach.map(s => s.name),
      ...user.skillsToLearn.map(s => s.name),
    ]
    
    const currentSkillIds = [
      ...user.skillsToTeach.map(s => s.id),
      ...user.skillsToLearn.map(s => s.id),
    ]
    
    // 2. Find pathway recommendations
    const pathwayRecommendations: string[] = []
    for (const skillName of currentSkillNames) {
      const nextSkills = this.skillPathways[skillName] || []
      pathwayRecommendations.push(...nextSkills)
    }
    
    // 3. Find skills in same category (complement current skills)
    const categoryRecommendations = await prisma.skill.findMany({
      where: {
        category: { in: user.skillsToTeach.map(s => s.category) },
        id: { notIn: currentSkillIds },
      },
      take: 5,
    })
    
    // 4. Find trending skills (most lessons in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const trendingSkills = await prisma.skill.findMany({
      where: {
        id: { notIn: currentSkillIds },
        lessons: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
      include: {
        _count: {
          select: {
            lessons: {
              where: {
                createdAt: { gte: thirtyDaysAgo },
              },
            },
          },
        },
      },
      orderBy: {
        lessons: {
          _count: 'desc',
        },
      },
      take: 5,
    })
    
    // 5. Find popular skill combinations (what others learned together)
    const similarUsers = await prisma.user.findMany({
      where: {
        id: { not: userId },
        skillsToLearn: {
          some: {
            id: { in: currentSkillIds },
          },
        },
      },
      select: {
        skillsToLearn: {
          where: {
            id: { notIn: currentSkillIds },
          },
          select: { id: true, name: true, category: true },
        },
      },
      take: 10,
    })
    
    // Count frequency of skills
    const skillFrequency: Record<string, { skill: any; count: number }> = {}
    for (const user of similarUsers) {
      for (const skill of user.skillsToLearn) {
        if (!skillFrequency[skill.id]) {
          skillFrequency[skill.id] = { skill, count: 0 }
        }
        skillFrequency[skill.id].count++
      }
    }
    
    const popularCombinations = Object.values(skillFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.skill)
    
    // 6. Combine and deduplicate recommendations
    const allRecommendations = new Map()
    
    // Add pathway recommendations (highest priority)
    const pathwaySkills = await prisma.skill.findMany({
      where: {
        name: { in: pathwayRecommendations },
        id: { notIn: currentSkillIds },
      },
    })
    
    for (const skill of pathwaySkills) {
      allRecommendations.set(skill.id, {
        ...skill,
        reason: 'Recommended based on your current skills',
        priority: 1,
      })
    }
    
    // Add popular combinations
    for (const skill of popularCombinations) {
      if (!allRecommendations.has(skill.id)) {
        allRecommendations.set(skill.id, {
          ...skill,
          reason: 'People with similar interests learned this',
          priority: 2,
        })
      }
    }
    
    // Add trending skills
    for (const skill of trendingSkills) {
      if (!allRecommendations.has(skill.id)) {
        allRecommendations.set(skill.id, {
          ...skill,
          reason: 'Trending skill - high demand',
          priority: 3,
          trendingScore: skill._count.lessons,
        })
      }
    }
    
    // Add category recommendations
    for (const skill of categoryRecommendations) {
      if (!allRecommendations.has(skill.id)) {
        allRecommendations.set(skill.id, {
          ...skill,
          reason: 'Complements your expertise',
          priority: 4,
        })
      }
    }
    
    // 7. Sort by priority and return
    return Array.from(allRecommendations.values())
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 10)
  }
}

/**
 * GET - Get personalized skill recommendations
 * 
 * Example: GET /api/skills/recommendations
 * Headers: Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Get recommendations
    const recommendations = await SkillRecommender.getRecommendations(
      currentUser.userId
    )
    
    // 3. Enhance with teacher availability
    const enhancedRecommendations = await Promise.all(
      recommendations.map(async (skill) => {
        const teacherCount = await prisma.user.count({
          where: {
            skillsToTeach: {
              some: { id: skill.id },
            },
          },
        })
        
        const avgPrice = await prisma.user.aggregate({
          where: {
            skillsToTeach: {
              some: { id: skill.id },
            },
            hourlyRate: { not: null },
          },
          _avg: {
            hourlyRate: true,
          },
        })
        
        return {
          ...skill,
          availability: {
            teachersAvailable: teacherCount,
            averagePrice: avgPrice._avg.hourlyRate || 0,
          },
        }
      })
    )
    
    return NextResponse.json({
      recommendations: enhancedRecommendations,
      message: 'Recommendations personalized for you',
    })
    
  } catch (error: any) {
    console.error('Get recommendations error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}