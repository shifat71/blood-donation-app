import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resend } from '@/lib/resend';
import { Role } from '@prisma/client';
import { getCompatibleDonorGroups } from '@/lib/bloodCompatibility';
import { sendSmsSafe } from '@/lib/sms';

// HTML escape function to prevent XSS in email templates
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sanitize email subject to prevent header injection attacks
function sanitizeEmailSubject(text: string): string {
  return text.replace(/[\r\n]/g, '').trim();
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== Role.MODERATOR && session?.user?.role !== Role.ADMIN) {
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
    let smsSent = 0;

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

      // Find all available donors whose blood group is compatible with the request.
      // When the request has a district, same-district donors are notified first;
      // if fewer than 3 are found, we expand to all compatible donors so urgent
      // requests always reach the widest possible pool.
      const compatibleGroups = getCompatibleDonorGroups(bloodRequest.bloodGroup);
      const donorBaseWhere = {
        bloodGroup: { in: compatibleGroups },
        isAvailable: true,
        user: { isVerified: true },
      };

      let donors = await prisma.donorProfile.findMany({
        where: bloodRequest.district
          ? { ...donorBaseWhere, currentDistrict: bloodRequest.district }
          : donorBaseWhere,
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      // If district filter yields fewer than 3 donors, fall back to all compatible
      if (bloodRequest.district && donors.length < 3) {
        donors = await prisma.donorProfile.findMany({
          where: donorBaseWhere,
          include: { user: { select: { id: true, email: true, name: true } } },
        });
      }

      if (donors.length > 0) {
        await prisma.donorNotification.createMany({
          data: donors.map((donor) => ({
            donorId: donor.user.id,
            bloodRequestId: bloodRequest.id,
          })),
          skipDuplicates: true,
        });
      }

      console.log(`[Blood Request Approval] Found ${donors.length} compatible donors`);

      // Helper function to process emails in batches to avoid rate limiting
      // Configurable via environment variables for flexibility with different email providers
      const BATCH_SIZE = Math.max(1, parseInt(process.env.EMAIL_BATCH_SIZE || '10', 10)) || 10;
      const BATCH_DELAY_MS = Math.max(0, parseInt(process.env.EMAIL_BATCH_DELAY_MS || '1000', 10)) || 1000;
      
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const createEmailPromise = (donor: typeof donors[0]) => 
        resend.emails.send({
          from: process.env.FROM_EMAIL ?? 'Blood Donation <onboarding@resend.dev>',
          to: donor.user.email,
          subject: sanitizeEmailSubject(`🩸 Urgent: ${bloodRequest.bloodGroup.replace('_', ' ')} Blood Needed`),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">🩸 Blood Donation Request</h1>
              </div>
              <div style="padding: 20px; background: #fff;">
                <p>Dear <strong>${escapeHtml(donor.user.name)}</strong>,</p>
                <p>A blood donation request has been approved that you are compatible to donate for.</p>
                
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                  <h3 style="color: #dc2626; margin-top: 0;">Request Details:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li>📍 <strong>Blood Group:</strong> ${escapeHtml(bloodRequest.bloodGroup.replace('_', ' '))}</li>
                    <li>👤 <strong>Patient:</strong> ${escapeHtml(bloodRequest.patientName) || 'N/A'}</li>
                    <li>🏥 <strong>Hospital:</strong> ${escapeHtml(bloodRequest.hospitalName) || 'N/A'}</li>
                    <li>📌 <strong>Location:</strong> ${escapeHtml(bloodRequest.location)}</li>
                    <li>💉 <strong>Units Needed:</strong> ${escapeHtml(String(bloodRequest.unitsNeeded))}</li>
                    <li>⚡ <strong>Urgency:</strong> ${escapeHtml(bloodRequest.urgency)}</li>
                  </ul>
                </div>
                
                <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
                  <h3 style="color: #22c55e; margin-top: 0;">Contact Information:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li>👤 <strong>Name:</strong> ${escapeHtml(bloodRequest.requesterName)}</li>
                    <li>📱 <strong>Phone:</strong> <a href="tel:${escapeHtml(bloodRequest.requesterPhone)}">${escapeHtml(bloodRequest.requesterPhone)}</a></li>
                    <li>📧 <strong>Email:</strong> <a href="mailto:${escapeHtml(bloodRequest.requesterEmail)}">${escapeHtml(bloodRequest.requesterEmail)}</a></li>
                  </ul>
                </div>
                
                ${bloodRequest.additionalInfo ? `<p style="background: #f3f4f6; padding: 10px; border-radius: 5px;"><strong>Additional Info:</strong> ${escapeHtml(bloodRequest.additionalInfo)}</p>` : ''}
                
                <p style="color: #dc2626; font-weight: bold;">If you can donate, please contact the requester immediately. Your donation can save a life!</p>
              </div>
              <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>This email was sent by Blood Donation App</p>
              </div>
            </div>
          `,
        }).then(result => ({ email: donor.user.email, result }));

      // Process emails in batches to avoid rate limiting
      const allResults: PromiseSettledResult<{ email: string; result: unknown }>[] = [];
      for (let i = 0; i < donors.length; i += BATCH_SIZE) {
        const batch = donors.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(createEmailPromise);
        const batchResults = await Promise.allSettled(batchPromises);
        allResults.push(...batchResults);
        
        // Add delay between batches (except after the last batch)
        if (i + BATCH_SIZE < donors.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }

      const results = allResults;
      
      // Process results to count successes and collect errors
      results.forEach((result, index) => {
        const donorEmail = donors[index].user.email;
        if (result.status === 'fulfilled') {
          emailsSent++;
        } else {
          const errorMessage = result.reason instanceof Error ? result.reason.message : 'Unknown error';
          console.error(`[Blood Request Approval] Email send failed:`, errorMessage);
          emailErrors.push(`${donorEmail}: ${errorMessage}`);
        }
      });

      console.log(`[Blood Request Approval] Emails sent: ${emailsSent}/${donors.length}`);

      // Send SMS to donors who have a phone number (best-effort, in parallel)
      const smsBody =
        `Blood donation needed: ${bloodRequest.bloodGroup.replace('_', ' ')} at ${bloodRequest.location}. ` +
        `Contact: ${bloodRequest.requesterName} ${bloodRequest.requesterPhone}. ` +
        `Urgency: ${bloodRequest.urgency}`;

      const smsResults = await Promise.allSettled(
        donors
          .filter((d) => d.phoneNumber)
          .map((d) => sendSmsSafe(d.phoneNumber, smsBody))
      );
      smsSent = smsResults.filter((r) => r.status === 'fulfilled').length;
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      emailsSent,
      smsSent,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error) {
    console.error('Error approving request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
