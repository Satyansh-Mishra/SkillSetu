/**
 * USER LOGIN ENDPOINT
 * 
 * POST /api/auth/login
 * 
 * What it does:
 * 1. Receives email & password
 * 2. Finds user in database
 * 3. Verifies password
 * 4. Returns JWT token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'
import { validate, loginSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request
    const body = await request.json()
    const validatedData = validate(loginSchema, body)
    
    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // 3. Verify password
    const isValidPassword = await verifyPassword(
      validatedData.password,
      user.password
    )
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // 4. Generate JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    // 5. Return user data (without password) and token
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
      },
      token,
    })
    
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}