import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BloodGroup } from '@prisma/client';

// GET donor profile
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const donorProfile = await prisma.donorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            isVerified: true,
          },
        },
      },
    });

    if (!donorProfile) {
      return NextResponse.json(
        { error: 'Donor profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(donorProfile);
  } catch (error) {
    console.error('Error fetching donor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create donor profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bloodGroup, phoneNumber, address, studentId, lastDonationDate } = body;

    // Validate blood group
    if (!bloodGroup || !Object.values(BloodGroup).includes(bloodGroup)) {
      return NextResponse.json(
        { error: 'Invalid blood group' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.donorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Donor profile already exists' },
        { status: 400 }
      );
    }

    // Create donor profile
    const donorProfile = await prisma.donorProfile.create({
      data: {
        userId: session.user.id,
        bloodGroup,
        phoneNumber,
        address,
        studentId,
        lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
        isAvailable: true,
      },
    });

    return NextResponse.json(donorProfile, { status: 201 });
  } catch (error) {
    console.error('Error creating donor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update donor profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bloodGroup, phoneNumber, address, studentId, lastDonationDate, isAvailable } = body;

    // Find existing profile
    const existingProfile = await prisma.donorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Donor profile not found' },
        { status: 404 }
      );
    }

    // Update profile
    const updatedProfile = await prisma.donorProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(bloodGroup && { bloodGroup }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(studentId !== undefined && { studentId }),
        ...(lastDonationDate !== undefined && { 
          lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null 
        }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating donor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
