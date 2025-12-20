import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resend } from '@/lib/resend';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'MODERATOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { requestId, action } = await req.json();

    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
    });

    if (!bloodRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const updatedRequest = await prisma.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        moderatorId: session.user.id,
        approvedAt: action === 'approve' ? new Date() : null,
      },
    });

    if (action === 'approve') {
      // First, auto-update availability for donors whose 90-day period has passed
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await prisma.donorProfile.updateMany({
        where: {
          isAvailable: false,
          lastDonationDate: {
            lte: ninetyDaysAgo,
          },
        },
        data: {
          isAvailable: true,
        },
      });

      // Now find all available donors with matching blood group
      const donors = await prisma.donorProfile.findMany({
        where: {
          bloodGroup: bloodRequest.bloodGroup,
          isAvailable: true,
          user: {
            isVerified: true,
          },
        },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      });

      const emailPromises = donors.map((donor) =>
        resend.emails.send({
          from: 'Blood Donation <onboarding@resend.dev>',
          to: donor.user.email,
          subject: `🩸 Urgent: ${bloodRequest.bloodGroup.replace('_', ' ')} Blood Needed`,
          html: `
            <h2>Blood Donation Request</h2>
            <p>Dear ${donor.user.name},</p>
            <p>A blood donation request has been approved that matches your blood group.</p>
            <h3>Request Details:</h3>
            <ul>
              <li><strong>Blood Group:</strong> ${bloodRequest.bloodGroup.replace('_', ' ')}</li>
              <li><strong>Patient:</strong> ${bloodRequest.patientName || 'N/A'}</li>
              <li><strong>Location:</strong> ${bloodRequest.location}</li>
              <li><strong>Hospital:</strong> ${bloodRequest.hospitalName || 'N/A'}</li>
              <li><strong>Units Needed:</strong> ${bloodRequest.unitsNeeded}</li>
              <li><strong>Urgency:</strong> ${bloodRequest.urgency}</li>
            </ul>
            <h3>Contact Information:</h3>
            <ul>
              <li><strong>Name:</strong> ${bloodRequest.requesterName}</li>
              <li><strong>Phone:</strong> ${bloodRequest.requesterPhone}</li>
              <li><strong>Email:</strong> ${bloodRequest.requesterEmail}</li>
            </ul>
            ${bloodRequest.additionalInfo ? `<p><strong>Additional Info:</strong> ${bloodRequest.additionalInfo}</p>` : ''}
            <p>If you can donate, please contact the requester immediately.</p>
          `,
        })
      );

      await Promise.allSettled(emailPromises);
    }

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('Error approving request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
