import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otp, otpExpiry },
    });

    await resend.emails.send({
      from: 'Blood Donation App <onboarding@resend.dev>',
      to: email,
      subject: 'Verify Your Email - Blood Donation App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Blood Donation App</h2>
          <p>Your verification code is:</p>
          <h1 style="background: #fee2e2; color: #dc2626; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px;">
            ${otp}
          </h1>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
