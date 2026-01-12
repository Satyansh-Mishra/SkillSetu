/**
 * TYPESCRIPT TYPE DEFINITIONS
 * 
 * Defines types for your entire application
 * Makes development easier with autocomplete
 */

import { User, Lesson, Review, Payment, Skill } from '@prisma/client'

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = any> {
  message?: string
  error?: string
  data?: T
}

export interface PaginationResponse {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==========================================
// USER TYPES
// ==========================================

export interface UserProfile extends Omit<User, 'password'> {
  stats?: {
    lessonsAsTeacher: number
    lessonsAsStudent: number
    totalReviews: number
    averageRating: number
  }
  skillsToTeach?: Skill[]
  skillsToLearn?: Skill[]
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: 'STUDENT' | 'TEACHER' | 'BOTH'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  user: Partial<User>
  token: string
}

export interface UpdateProfileRequest {
  name?: string
  bio?: string
  phone?: string
  location?: string
  timezone?: string
  hourlyRate?: number
  experience?: number
}

// ==========================================
// LESSON TYPES
// ==========================================

export interface LessonWithDetails extends Lesson {
  teacher: Partial<User>
  student: Partial<User>
  skill: Skill
  payment?: Partial<Payment>
  review?: Partial<Review>
}

export interface BookLessonRequest {
  teacherId: string
  skillId: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  price: number
}

export interface LessonListResponse {
  lessons: LessonWithDetails[]
  pagination: PaginationResponse
}

// ==========================================
// PAYMENT TYPES
// ==========================================

export interface CreatePaymentRequest {
  lessonId: string
  provider: 'RAZORPAY' | 'STRIPE' | 'PAYPAL'
  amount: number
  currency: string
}

export interface RazorpayOrderResponse {
  id: string
  amount: number
  currency: string
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// ==========================================
// REVIEW TYPES
// ==========================================

export interface ReviewWithDetails extends Review {
  giver: Partial<User>
  lesson: Partial<Lesson>
}

export interface CreateReviewRequest {
  lessonId: string
  rating: number
  knowledge?: number
  clarity?: number
  patience?: number
  timing?: number
  comment?: string
}

export interface ReviewStats {
  averageRating: number
  averageKnowledge: number
  averageClarity: number
  averagePatience: number
  averageTiming: number
  totalReviews: number
}

export interface ReviewListResponse {
  reviews: ReviewWithDetails[]
  stats: ReviewStats
  pagination: PaginationResponse
}

// ==========================================
// SKILL TYPES
// ==========================================

export interface CreateSkillRequest {
  name: string
  category: string
  description?: string
}

// ==========================================
// UPLOAD TYPES
// ==========================================

export interface UploadResponse {
  message: string
  url: string
  publicId: string
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================

export interface NotificationData {
  type: 'LESSON_BOOKED' | 'LESSON_CONFIRMED' | 'LESSON_REMINDER' | 
        'LESSON_CANCELLED' | 'REVIEW_RECEIVED' | 'PAYMENT_RECEIVED' | 
        'BADGE_EARNED' | 'MESSAGE_RECEIVED'
  title: string
  message: string
  link?: string
}

// ==========================================
// ERROR TYPES
// ==========================================

export interface ApiError {
  error: string
  details?: any
  statusCode?: number
}