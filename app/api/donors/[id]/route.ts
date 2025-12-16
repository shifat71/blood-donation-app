import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, BloodGroup } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const donor = await prisma.donorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isVerified: true,
          },
        },
      },
    });

    if (!donor || !donor.user.isVerified) {
      return NextResponse.json({ error: 'Donor not found' }, { status: 404 });
    }

    return NextResponse.json(donor);
  } catch (error) {
    console.error('Error fetching donor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update donor profile (moderator/admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== Role.MODERATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      bloodGroup, 
      phoneNumber, 
      address, 
      studentId, 
      lastDonationDate, 
      isAvailable, 
      currentDistrict, 
      department, 
      session: academicSession,
      userName
    } = body;

    // Find existing profile
    const existingProfile = await prisma.donorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 });
    }

    // Update donor profile
    const updatedProfile = await prisma.donorProfile.update({
      where: { id },
      data: {
        ...(bloodGroup && Object.values(BloodGroup).includes(bloodGroup) && { bloodGroup }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(studentId !== undefined && { studentId }),
        ...(lastDonationDate !== undefined && { 
          lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null 
        }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(currentDistrict !== undefined && { currentDistrict }),
        ...(department !== undefined && { department }),
        ...(academicSession !== undefined && { session: academicSession }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isVerified: true,
          },
        },
      },
    });

    // Update user name if provided
    if (userName !== undefined) {
      await prisma.user.update({
        where: { id: existingProfile.userId },
        data: { name: userName },
      });
    }

    console.log(`[Admin/Moderator] Profile ${id} updated by ${session.user.email}`);

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating donor profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
