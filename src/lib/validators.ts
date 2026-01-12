/**
 * INPUT VALIDATION SCHEMAS
 * 
 * Uses Zod to validate incoming data
 * Prevents bad data from entering database
 */

import { z } from 'zod'

// ==========================================
// USER VALIDATION
// ==========================================

/**
 * User Registration Schema
 * Validates: email, password, name
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  role: z.enum(['STUDENT', 'TEACHER', 'BOTH']).optional(),
})

/**
 * User Login Schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
})

/**
 * Profile Update Schema
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  location: z.string().max(100).optional(),
  timezone: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
  experience: z.number().int().min(0).optional(),
})

// ==========================================
// LESSON VALIDATION
// ==========================================

/**
 * Lesson Booking Schema
 */
export const bookLessonSchema = z.object({
  teacherId: z.string().uuid('Invalid teacher ID'),
  skillId: z.string().uuid('Invalid skill ID'),
  title: z.string().min(5, 'Title too short').max(200),
  description: z.string().max(1000).optional(),
  scheduledAt: z.string().datetime('Invalid date format'),
  duration: z.number().int().min(30).max(240), // 30 min to 4 hours
  price: z.number().positive('Price must be positive'),
})

/**
 * Lesson Update Schema
 */
export const updateLessonSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  meetingLink: z.string().url().optional(),
  recordingUrl: z.string().url().optional(),
  transcriptUrl: z.string().url().optional(),
  cancellationReason: z.string().max(500).optional(),
})

// ==========================================
// REVIEW VALIDATION
// ==========================================

/**
 * Review Submission Schema
 */
export const createReviewSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
  rating: z.number().int().min(1).max(5, 'Rating must be 1-5'),
  knowledge: z.number().int().min(1).max(5).optional(),
  clarity: z.number().int().min(1).max(5).optional(),
  patience: z.number().int().min(1).max(5).optional(),
  timing: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
})

// ==========================================
// AVAILABILITY VALIDATION
// ==========================================

/**
 * Availability Schema
 */
export const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  isAvailable: z.boolean().optional(),
})

// ==========================================
// SKILL VALIDATION
// ==========================================

/**
 * Skill Creation Schema
 */
export const createSkillSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
})

// ==========================================
// PAYMENT VALIDATION
// ==========================================

/**
 * Payment Initiation Schema
 */
export const initiatePaymentSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
  provider: z.enum(['RAZORPAY', 'STRIPE', 'PAYPAL']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., INR, USD)'),
})

/**
 * Payment Verification Schema (Razorpay)
 */
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

// ==========================================
// HELPER FUNCTION
// ==========================================

/**
 * Validate data against schema
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validated data or throws error
 * 
 * Example:
 * const validData = validate(registerSchema, requestBody)
 * // If invalid, throws error with details
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}