import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RequestStatus, Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { requesterName, requesterPhone, bloodGroup, urgency, location, hospitalName, patientName, unitsNeeded, additionalInfo } = data;

    const request = await prisma.bloodRequest.create({
      data: {
        requesterName,
        requesterEmail: session.user.email,
        requesterPhone,
        bloodGroup,
        urgency,
        location,
        hospitalName,
        patientName,
        unitsNeeded: parseInt(unitsNeeded) || 1,
        additionalInfo,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('Error creating blood request:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: Prisma.BloodRequestWhereInput = {};
    if (status) {
      where.status = status as RequestStatus;
    }

    if (session?.user?.role !== 'MODERATOR' && session?.user?.role !== 'ADMIN') {
      where.requesterEmail = session?.user?.email;
    }

    const requests = await prisma.bloodRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        moderator: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}
