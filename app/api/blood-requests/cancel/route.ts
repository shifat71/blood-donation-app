import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/blood-requests/cancel — requester cancels their own PENDING request
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
    });

    if (!bloodRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (bloodRequest.requesterEmail !== session.user.email) {
      return NextResponse.json({ error: 'You can only cancel your own requests' }, { status: 403 });
    }

    if (bloodRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel a request with status ${bloodRequest.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.bloodRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error('Error cancelling blood request:', error);
    return NextResponse.json({ error: 'Failed to cancel request' }, { status: 500 });
  }
}
