import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let url: URL;
    try {
      url = new URL(req.url);
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const status = url.searchParams.get('status');
    const markRead = url.searchParams.get('markRead') !== 'false';

    if (status && !Object.values(NotificationStatus).includes(status as NotificationStatus)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    if (markRead) {
      await prisma.donorNotification.updateMany({
        where: {
          donorId: session.user.id,
          status: NotificationStatus.UNREAD,
        },
        data: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      });
    }

    const notifications = await prisma.donorNotification.findMany({
      where: {
        donorId: session.user.id,
        ...(status ? { status: status as NotificationStatus } : {}),
      },
      include: {
        bloodRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching donor notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
