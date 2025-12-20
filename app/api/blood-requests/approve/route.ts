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

    let emailsSent = 0;
    const emailErrors: string[] = [];

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

      console.log(`[Blood Request Approval] Found ${donors.length} matching donors for blood group ${bloodRequest.bloodGroup}`);

      // Send emails to each donor
      for (const donor of donors) {
        try {
          console.log(`[Blood Request Approval] Sending email to: ${donor.user.email}`);
          
          const result = await resend.emails.send({
            from: 'Blood Donation <onboarding@resend.dev>',
            to: donor.user.email,
            subject: `🩸 Urgent: ${bloodRequest.bloodGroup.replace('_', ' ')} Blood Needed`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">🩸 Blood Donation Request</h1>
                </div>
                <div style="padding: 20px; background: #fff;">
                  <p>Dear <strong>${donor.user.name}</strong>,</p>
                  <p>A blood donation request has been approved that matches your blood group.</p>
                  
                  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #dc2626; margin-top: 0;">Request Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                      <li>📍 <strong>Blood Group:</strong> ${bloodRequest.bloodGroup.replace('_', ' ')}</li>
                      <li>👤 <strong>Patient:</strong> ${bloodRequest.patientName || 'N/A'}</li>
                      <li>🏥 <strong>Hospital:</strong> ${bloodRequest.hospitalName || 'N/A'}</li>
                      <li>📌 <strong>Location:</strong> ${bloodRequest.location}</li>
                      <li>💉 <strong>Units Needed:</strong> ${bloodRequest.unitsNeeded}</li>
                      <li>⚡ <strong>Urgency:</strong> ${bloodRequest.urgency}</li>
                    </ul>
                  </div>
                  
                  <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #22c55e; margin-top: 0;">Contact Information:</h3>
                    <ul style="list-style: none; padding: 0;">
                      <li>👤 <strong>Name:</strong> ${bloodRequest.requesterName}</li>
                      <li>📱 <strong>Phone:</strong> <a href="tel:${bloodRequest.requesterPhone}">${bloodRequest.requesterPhone}</a></li>
                      <li>📧 <strong>Email:</strong> <a href="mailto:${bloodRequest.requesterEmail}">${bloodRequest.requesterEmail}</a></li>
                    </ul>
                  </div>
                  
                  ${bloodRequest.additionalInfo ? `<p style="background: #f3f4f6; padding: 10px; border-radius: 5px;"><strong>Additional Info:</strong> ${bloodRequest.additionalInfo}</p>` : ''}
                  
                  <p style="color: #dc2626; font-weight: bold;">If you can donate, please contact the requester immediately. Your donation can save a life!</p>
                </div>
                <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                  <p>This email was sent by Blood Donation App</p>
                </div>
              </div>
            `,
          });
          
          console.log(`[Blood Request Approval] Email sent successfully to ${donor.user.email}:`, result);
          emailsSent++;
        } catch (emailError) {
          const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
          console.error(`[Blood Request Approval] Failed to send email to ${donor.user.email}:`, errorMessage);
          emailErrors.push(`${donor.user.email}: ${errorMessage}`);
        }
      }

      console.log(`[Blood Request Approval] Emails sent: ${emailsSent}/${donors.length}`);
      if (emailErrors.length > 0) {
        console.log(`[Blood Request Approval] Email errors:`, emailErrors);
      }
    }

    return NextResponse.json({ 
      success: true, 
      request: updatedRequest,
      emailsSent,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error) {
    console.error('Error approving request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
