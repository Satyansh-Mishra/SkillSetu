/**
 * GLOBAL MIDDLEWARE
 * 
 * Runs on EVERY request to your API
 * 
 * Handles:
 * - CORS (Cross-Origin Resource Sharing)
 * - Rate limiting (prevent spam)
 * - Request logging
 * - Security headers
 */

import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter
// In production, use Redis for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting function
 * Limits requests per IP address
 */
function rateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 100
  
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false // Rate limit exceeded
  }
  
  record.count++
  return true
}

/**
 * Main middleware function
 */
export function proxy(request: NextRequest) {
  // 1. Check rate limit
  if (!rateLimit(request)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }
  
  // 2. CORS headers
  const response = NextResponse.next()
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 3. Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // 4. Log request (in production, use proper logging service)
  if (process.env.NODE_ENV === 'development') {
    console.log(`${request.method} ${request.nextUrl.pathname}`)
  }
  
  return response
}

/**
 * Configure which routes to run middleware on
 */
export const config = {
  matcher: [
    '/api/:path*', // All API routes
  ],
}