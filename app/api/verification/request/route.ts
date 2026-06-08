import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST create verification request
export async function POST(request: NextRequest) {
  try {
    let userId: string;
    let idCardImageUrl: string | null = null;
    let studentId: string | undefined;
    
    const contentType = request.headers.get('content-type') || '';

    // Handle both FormData (with file upload) and JSON
    if (contentType.includes('multipart/form-data')) {
      // File upload from signup (no session yet)
      const formData = await request.formData();
      const userIdParam = formData.get('userId') as string;
      const studentIdParam = formData.get('studentId') as string;
      const idCardFile = formData.get('idCard') as File | null;
      
      if (!userIdParam) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }
      
      userId = userIdParam;
      studentId = studentIdParam || undefined;
      
      // Upload to Cloudinary if file exists
      if (idCardFile && idCardFile.size > 0) {
        try {
          const { uploadToCloudinary } = await import('@/lib/cloudinary');
          const bytes = await idCardFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          idCardImageUrl = await uploadToCloudinary(buffer, 'student-id-cards');
        } catch (uploadError) {
          console.error('[Verification Request] Cloudinary upload failed:', uploadError);
          // Continue without image - moderators can request it later
          idCardImageUrl = null;
        }
      }
    } else {
      // JSON request from dashboard (with session)
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      userId = session.user.id;
      const body = await request.json();
      const base64Image = body.idCardImageUrl;
      studentId = body.studentId;
      
      if (base64Image) {
        try {
          const { uploadToCloudinary } = await import('@/lib/cloudinary');
          idCardImageUrl = await uploadToCloudinary(base64Image, 'student-id-cards');
        } catch (uploadError) {
          console.error('[Verification Request] Cloudinary upload failed:', uploadError);
          // Store base64 directly as fallback
          idCardImageUrl = base64Image;
        }
      }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'User is already verified' },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId: userId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending verification request', existingRequestId: existingRequest.id },
        { status: 400 }
      );
    }

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: userId,
        idCardImageUrl,
        studentId: studentId || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      id: verificationRequest.id,
      message: 'Verification request submitted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('[Verification Request] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create verification request. Please try again.' },
      { status: 500 }
    );
  }
}

// GET verification status
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verificationRequests = await prisma.verificationRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(verificationRequests);
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
