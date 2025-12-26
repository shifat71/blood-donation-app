import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await req.json();
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId: session.user.id } });
    if (!donorProfile) {
      return NextResponse.json({ error: 'Create your donor profile before accepting requests' }, { status: 400 });
    }
    if (!donorProfile.isAvailable) {
      return NextResponse.json({ error: 'You are currently unavailable to donate' }, { status: 400 });
    }

    const notification = await prisma.donorNotification.findUnique({
      where: { id: notificationId },
      include: { bloodRequest: true },
    });

    if (!notification || notification.donorId !== session.user.id) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.status === NotificationStatus.CLOSED || notification.bloodRequest.acceptedDonorId) {
      return NextResponse.json({ error: 'This request has already been accepted' }, { status: 409 });
    }

    if (notification.bloodRequest.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Only approved requests can be accepted' }, { status: 400 });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const now = new Date();

        const locked = await tx.bloodRequest.updateMany({
          where: { id: notification.bloodRequestId, acceptedDonorId: null },
          data: {
            acceptedDonorId: session.user.id,
            acceptedAt: now,
            status: 'FULFILLED',
          },
        });

        if (locked.count === 0) {
          throw new Error('ALREADY_ACCEPTED');
        }

        const updatedNotification = await tx.donorNotification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.CLOSED,
            readAt: now,
            acceptedAt: now,
          },
        });

        await tx.donorNotification.updateMany({
          where: {
            bloodRequestId: notification.bloodRequestId,
            id: { not: notification.id },
          },
          data: {
            status: NotificationStatus.CLOSED,
            readAt: now,
          },
        });

        await tx.donorProfile.updateMany({
          where: { userId: session.user.id },
          data: { isAvailable: false },
        });

        // Create notification for the requester
        await tx.requesterNotification.create({
          data: {
            requesterEmail: notification.bloodRequest.requesterEmail,
            bloodRequestId: notification.bloodRequestId,
            donorId: session.user.id,
          },
        });

        const updatedRequest = await tx.bloodRequest.findUnique({
          where: { id: notification.bloodRequestId },
          include: {
            acceptedDonor: {
              select: { name: true, email: true },
            },
          },
        });

        return { updatedNotification, updatedRequest };
      });

      return NextResponse.json({ success: true, notification: result.updatedNotification, request: result.updatedRequest });
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_ACCEPTED') {
        return NextResponse.json({ error: 'Request already accepted by another donor' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error accepting blood request:', error);
    return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 });
  }
}
