import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BloodGroup } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bloodGroup = searchParams.get('bloodGroup');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const search = searchParams.get('search');

    const where: any = {
      user: {
        isVerified: true,
      },
    };

    if (bloodGroup && Object.values(BloodGroup).includes(bloodGroup as BloodGroup)) {
      where.bloodGroup = bloodGroup;
    }

    if (availableOnly) {
      where.isAvailable = true;
    }

    const donors = await prisma.donorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Filter by name if search query is provided
    let filteredDonors = donors;
    if (search) {
      filteredDonors = donors.filter(donor =>
        donor.user.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json(filteredDonors);
  } catch (error) {
    console.error('Error fetching donors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
