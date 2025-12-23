import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RequestStatus, Prisma, Role } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to submit a request.' }, { status: 401 });
    }

    let data;
    try {
      data = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { requesterName, requesterPhone, bloodGroup, urgency, location, hospitalName, patientName, unitsNeeded, additionalInfo } = data;

    // Validate required fields
    if (!requesterName?.trim()) {
      return NextResponse.json({ error: 'Requester name is required' }, { status: 400 });
    }
    if (!requesterPhone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    if (!bloodGroup) {
      return NextResponse.json({ error: 'Blood group is required' }, { status: 400 });
    }
    if (!urgency) {
      return NextResponse.json({ error: 'Urgency level is required' }, { status: 400 });
    }
    if (!location?.trim()) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    // Validate phone number format and clean it
    const cleanedPhone = requesterPhone.replace(/[\s-]/g, '');
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const request = await prisma.bloodRequest.create({
      data: {
        requesterName,
        requesterEmail: session.user.email,
        requesterPhone: cleanedPhone,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'A duplicate request already exists' }, { status: 409 });
      }
    }
    return NextResponse.json({ error: 'Failed to create request. Please try again.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    let url: URL;
    try {
      url = new URL(req.url);
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const status = url.searchParams.get('status');

    // Validate status if provided
    if (status && !['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status filter. Must be PENDING, APPROVED, REJECTED, or FULFILLED.' }, { status: 400 });
    }

    const where: Prisma.BloodRequestWhereInput = {};
    if (status) {
      where.status = status as RequestStatus;
    }

    if (session?.user?.role !== Role.MODERATOR && session?.user?.role !== Role.ADMIN) {
      where.requesterEmail = session?.user?.email;
    }

    const requests = await prisma.bloodRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        moderator: {
          select: { name: true, email: true },
        },
        acceptedDonor: {
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
