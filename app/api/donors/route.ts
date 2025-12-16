import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BloodGroup, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bloodGroup = searchParams.get('bloodGroup');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Prisma.DonorProfileWhereInput = {
      user: {
        isVerified: true,
      },
    };

    if (bloodGroup && Object.values(BloodGroup).includes(bloodGroup as BloodGroup)) {
      where.bloodGroup = bloodGroup as BloodGroup;
    }

    if (availableOnly) {
      where.isAvailable = true;
    }

    if (search) {
      where.user = {
        isVerified: true,
        name: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    const [donors, total] = await Promise.all([
      prisma.donorProfile.findMany({
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
        take: limit,
        skip,
      }),
      prisma.donorProfile.count({ where }),
    ]);

    return NextResponse.json({
      donors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + donors.length < total,
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
