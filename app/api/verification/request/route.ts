import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VerificationType } from '@prisma/client';

// POST create verification request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { idCardImageUrl, studentId } = body;

    if (!idCardImageUrl || !studentId) {
      return NextResponse.json(
        { error: 'ID card image and student ID are required' },
        { status: 400 }
      );
    }

    // Check if user is already verified
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        userId: session.user.id,
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
        userId: session.user.id,
        idCardImageUrl,
        studentId,
        status: 'PENDING',
      },
    });

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
