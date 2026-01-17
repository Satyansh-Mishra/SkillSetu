import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ skills: [] });
    }

    const skills = await prisma.skill.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      take: 10, // Limit results
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Skill search error:', error);
    return NextResponse.json({ error: 'Failed to search skills' }, { status: 500 });
  }
}