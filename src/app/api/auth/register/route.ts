import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';
import { validate, registerSchema } from '@/lib/validators';
import { ZodError } from 'zod'; // Make sure this is imported

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = validate(registerSchema, body);
    
    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create user
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
      },
    });
    
    // Generate Token
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    return NextResponse.json({
      message: 'Registration successful',
      user,
      token,
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // ✅ FIX: Use 'error.issues' instead of 'error.errors'
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.issues // <--- CHANGED THIS
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}