import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Debug endpoint to check all verification requests (development only)
export async function GET(_request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const allRequests = await prisma.verificationRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isVerified: true,
            verificationType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        verificationType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      verificationRequests: {
        total: allRequests.length,
        pending: allRequests.filter(r => r.status === 'PENDING').length,
        approved: allRequests.filter(r => r.status === 'APPROVED').length,
        rejected: allRequests.filter(r => r.status === 'REJECTED').length,
        items: allRequests,
      },
      recentUsers: allUsers,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: String(error) }, { status: 500 });
  }
}
