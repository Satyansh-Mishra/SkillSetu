/**
 * AUTHENTICATION HELPERS
 * 
 * Functions for:
 * - Hashing passwords
 * - Verifying passwords
 * - Creating JWT tokens
 * - Verifying JWT tokens
 */

import bcrypt from 'bcrypt'
import jwt,{SignOptions} from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET:string = process.env.JWT_SECRET as string
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
const options: SignOptions = {
  expiresIn: JWT_EXPIRES_IN,
};

// ==========================================
// PASSWORD HASHING
// ==========================================

/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 * 
 * Example:
 * const hashed = await hashPassword("mypassword123")
 * // Returns: "$2a$10$..."
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns true if match, false otherwise
 * 
 * Example:
 * const isValid = await verifyPassword("mypassword123", user.password)
 * if (isValid) { // Login successful }
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ==========================================
// JWT TOKEN MANAGEMENT
// ==========================================

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: string
  email: string
  role: string
}

/**
 * Create a JWT token
 * @param payload - User data to encode
 * @returns JWT token string
 * 
 * Example:
 * const token = createToken({ userId: "123", email: "user@example.com", role: "STUDENT" })
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, options)
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 * 
 * Example:
 * const payload = verifyToken(token)
 * if (payload) {
 *   console.log(payload.userId) // "123"
 * }
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 * @param request - Next.js request object
 * @returns Token string or null
 * 
 * Example:
 * // Request header: "Authorization: Bearer eyJhbGci..."
 * const token = extractToken(request)
 * // Returns: "eyJhbGci..."
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.substring(7) // Remove "Bearer " prefix
}

/**
 * Get current user from request
 * @param request - Next.js request object
 * @returns User payload or null
 * 
 * Example:
 * const user = getCurrentUser(request)
 * if (!user) {
 *   return new Response("Unauthorized", { status: 401 })
 * }
 */
export function getCurrentUser(request: NextRequest): JWTPayload | null {
  const token = extractToken(request)
  if (!token) return null
  
  return verifyToken(token)
}

/**
 * Require authentication middleware
 * Throws error if user not authenticated
 * 
 * Example:
 * export async function GET(request: NextRequest) {
 *   const user = requireAuth(request)
 *   // If reaches here, user is authenticated
 * }
 */
export function requireAuth(request: NextRequest): JWTPayload {
  const user = getCurrentUser(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}