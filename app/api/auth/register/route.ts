import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { VerificationType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, studentId, verificationType } = body;

    console.log('[Register] Request received:', { email, name, studentId, verificationType });

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine verification status
    const isUniversityEmail = email.endsWith('@student.sust.edu');
    
    // Backend validation: Auto verification requires university email
    if (verificationType === 'auto' && !isUniversityEmail) {
      return NextResponse.json(
        { error: 'Auto-verification requires a @student.sust.edu email address' },
        { status: 400 }
      );
    }
    
    const isAutoVerification = verificationType === 'auto' && isUniversityEmail;
    
    console.log('[Register] Verification decision:', { isUniversityEmail, isAutoVerification, verificationType });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isVerified: isAutoVerification && isUniversityEmail,
        verificationType: isAutoVerification ? VerificationType.AUTO : VerificationType.MANUAL,
        otp,
        otpExpiry,
      },
    });

    console.log('[Register] User created:', user.id, 'isVerified:', user.isVerified);

    // Send OTP email
    try {
      await resend.emails.send({
        from: 'Blood Donation App <onboarding@resend.dev>',
        to: email,
        subject: 'Verify Your Email - Blood Donation App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Welcome to Blood Donation App!</h2>
            <p>Hi ${name},</p>
            <p>Thank you for registering. Your verification code is:</p>
            <h1 style="background: #fee2e2; color: #dc2626; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px;">
              ${otp}
            </h1>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('[Register] Failed to send OTP email:', emailError);
    }

    return NextResponse.json(
      {
        message: 'Account created. Please verify your email with the OTP sent.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
          verificationType: user.verificationType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
