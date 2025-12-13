import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

// POST create verification request
export async function POST(request: NextRequest) {
  try {
    let userId: string;
    let idCardImageUrl: string | undefined;
    let studentId: string | undefined;
    
    const contentType = request.headers.get('content-type');
    console.log('[Verification Request] Content-Type:', contentType);
    
    // Handle both FormData (with file upload) and JSON
    if (contentType?.includes('multipart/form-data')) {
      // File upload from signup (no session yet)
      const formData = await request.formData();
      const userIdParam = formData.get('userId') as string;
      const studentIdParam = formData.get('studentId') as string;
      const idCardFile = formData.get('idCard') as File;
      
      console.log('[Verification Request] FormData - userId:', userIdParam, 'studentId:', studentIdParam, 'hasFile:', !!idCardFile);
      
      if (!userIdParam || !idCardFile) {
        return NextResponse.json(
          { error: 'User ID and ID card image are required' },
          { status: 400 }
        );
      }
      
      userId = userIdParam;
      studentId = studentIdParam;
      
      // Upload to Cloudinary
      const bytes = await idCardFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      idCardImageUrl = await uploadToCloudinary(buffer, 'student-id-cards');
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
      
      if (!base64Image || !studentId) {
        return NextResponse.json(
          { error: 'ID card image and student ID are required' },
          { status: 400 }
        );
      }
      
      // Upload base64 image to Cloudinary
      idCardImageUrl = await uploadToCloudinary(base64Image, 'student-id-cards');
    }

    // Check if user is already verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.isVerified) {
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
        { error: 'You already have a pending verification request' },
        { status: 400 }
      );
    }

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: userId,
        idCardImageUrl,
        studentId,
        status: 'PENDING',
      },
    });

    console.log('[Verification Request] Created successfully:', verificationRequest.id);
    return NextResponse.json(verificationRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating verification request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET verification status
export async function GET(request: NextRequest) {
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
