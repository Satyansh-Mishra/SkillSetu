/**
 * USER REGISTRATION ENDPOINT
 * 
 * POST /api/auth/register
 * 
 * What it does:
 * 1. Receives email, password, name from user
 * 2. Validates the input
 * 3. Checks if email already exists
 * 4. Hashes the password
 * 5. Creates user in database
 * 6. Returns JWT token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'
import { validate, registerSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json()
    
    // 2. Validate input
    const validatedData = validate(registerSchema, body)
    
    // console.log(validatedData)
    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }
    
    // 4. Hash password
    const hashedPassword = await hashPassword(validatedData.password)
    
    // 5. Create user in database
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role || 'STUDENT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        // Don't return password!
      },
    })
    
    // 6. Generate JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    // 7. Return success response
    return NextResponse.json({
      message: 'Registration successful',
      user,
      token,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    // Generic error
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}