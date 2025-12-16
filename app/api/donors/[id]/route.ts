import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
