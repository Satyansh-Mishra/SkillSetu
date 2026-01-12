/**
 * FILE UPLOAD ENDPOINT
 * 
 * POST /api/upload
 * Uploads images to Cloudinary
 * 
 * Supports:
 * - Profile pictures
 * - Certificates
 * - Lesson materials
 */

import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST - Upload file
 * 
 * Example request:
 * POST /api/upload
 * Content-Type: multipart/form-data
 * Body: FormData with 'file' field
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const currentUser = requireAuth(request)
    
    // 2. Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // "profile" | "certificate"
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // 3. Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WEBP, PDF' },
        { status: 400 }
      )
    }
    
    // 4. Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Max size: 5MB' },
        { status: 400 }
      )
    }
    
    // 5. Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`
    
    // 6. Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: `skill-exchange/${type}`,
      resource_type: 'auto',
      transformation: type === 'profile' ? [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ] : undefined,
    })
    
    // 7. Update user profile if it's a profile picture
    if (type === 'profile') {
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: { profileImage: uploadResult.secure_url },
      })
    }
    
    return NextResponse.json({
      message: 'File uploaded successfully',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    })
    
  } catch (error: any) {
    console.error('Upload error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete uploaded file
 * 
 * Example request:
 * DELETE /api/upload
 * Body: { "publicId": "skill-exchange/profile/abc123" }
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify authentication
    requireAuth(request)
    
    // 2. Parse request
    const { publicId } = await request.json()
    
    if (!publicId) {
      return NextResponse.json(
        { error: 'publicId required' },
        { status: 400 }
      )
    }
    
    // 3. Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId)
    
    return NextResponse.json({
      message: 'File deleted successfully',
    })
    
  } catch (error: any) {
    console.error('Delete error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}