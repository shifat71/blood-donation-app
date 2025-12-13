import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, VerificationStatus } from '@prisma/client';

// GET all pending verification requests (moderator/admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== Role.MODERATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const verificationRequests = await prisma.verificationRequest.findMany({
      where: { status: VerificationStatus.PENDING },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
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

// PUT update verification request (moderator/admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== Role.MODERATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, status, reason } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    if (![VerificationStatus.APPROVED, VerificationStatus.REJECTED].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Find the verification request
    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    // Update verification request and user status
    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.verificationRequest.update({
        where: { id: requestId },
        data: {
          status,
          reason,
          moderatorId: session.user.id,
          reviewedAt: new Date(),
        },
      });

      if (status === VerificationStatus.APPROVED) {
        await tx.user.update({
          where: { id: verificationRequest.userId },
          data: {
            isVerified: true,
            verificationType: 'MANUAL',
          },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating verification request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
