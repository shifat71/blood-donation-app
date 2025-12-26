import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET - Fetch requester notifications
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.requesterNotification.findMany({
            where: {
                requesterEmail: session.user.email,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                bloodRequest: {
                    select: {
                        id: true,
                        bloodGroup: true,
                        urgency: true,
                        location: true,
                        hospitalName: true,
                        patientName: true,
                        unitsNeeded: true,
                        status: true,
                        acceptedAt: true,
                    },
                },
                donor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        donorProfile: {
                            select: {
                                phoneNumber: true,
                                bloodGroup: true,
                                currentDistrict: true,
                                profilePicture: true,
                            },
                        },
                    },
                },
            },
        });

        // Count unread notifications
        const unreadCount = await prisma.requesterNotification.count({
            where: {
                requesterEmail: session.user.email,
                status: NotificationStatus.UNREAD,
            },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching requester notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// PATCH - Mark notifications as read
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationId, markAllAsRead } = await req.json();

        if (markAllAsRead) {
            // Mark all notifications as read
            await prisma.requesterNotification.updateMany({
                where: {
                    requesterEmail: session.user.email,
                    status: NotificationStatus.UNREAD,
                },
                data: {
                    status: NotificationStatus.READ,
                    readAt: new Date(),
                },
            });

            return NextResponse.json({ success: true, message: 'All notifications marked as read' });
        }

        if (!notificationId) {
            return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
        }

        // Mark single notification as read
        const notification = await prisma.requesterNotification.findUnique({
            where: { id: notificationId },
        });

        if (!notification || notification.requesterEmail !== session.user.email) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        const updatedNotification = await prisma.requesterNotification.update({
            where: { id: notificationId },
            data: {
                status: NotificationStatus.READ,
                readAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, notification: updatedNotification });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}
