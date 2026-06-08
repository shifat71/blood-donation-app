import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RequestStatus, BloodRequestUrgency, BloodGroup, Prisma, Role } from '@prisma/client';
import { normalizeBdPhone } from '@/lib/phone';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to submit a request.' }, { status: 401 });
    }

    // Rate limit: 5 requests per 10 minutes per email
    const { allowed, retryAfterSeconds } = checkRateLimit(session.user.email!);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    let data;
    try {
      data = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { requesterName, requesterPhone, bloodGroup, urgency, location, district, hospitalName, patientName, unitsNeeded, additionalInfo } = data;

    // Validate required fields
    if (!requesterName?.trim()) {
      return NextResponse.json({ error: 'Requester name is required' }, { status: 400 });
    }
    if (!requesterPhone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    if (!bloodGroup || !Object.values(BloodGroup).includes(bloodGroup)) {
      return NextResponse.json({ error: 'Invalid blood group' }, { status: 400 });
    }
    if (!urgency || !Object.values(BloodRequestUrgency).includes(urgency)) {
      return NextResponse.json({ error: 'Urgency must be URGENT, MODERATE, or NORMAL' }, { status: 400 });
    }
    if (!location?.trim()) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    // Validate and normalize the phone number to canonical E.164 (+8801XXXXXXXXX)
    const cleanedPhone = normalizeBdPhone(requesterPhone);
    if (!cleanedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone number. Enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX).' },
        { status: 400 }
      );
    }

    const request = await prisma.bloodRequest.create({
      data: {
        requesterName,
        requesterEmail: session.user.email,
        requesterPhone: cleanedPhone,
        bloodGroup,
        urgency,
        location,
        district: district?.trim() || null,
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
    if (status && !Object.values(RequestStatus).includes(status as RequestStatus)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
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
