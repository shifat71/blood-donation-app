import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
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
    const isAutoVerification = verificationType === 'auto' || (isUniversityEmail && verificationType !== 'manual');
    
    console.log('[Register] Verification decision:', { isUniversityEmail, isAutoVerification, verificationType });

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isVerified: isAutoVerification && isUniversityEmail,
        verificationType: isAutoVerification ? VerificationType.AUTO : VerificationType.MANUAL,
      },
    });

    console.log('[Register] User created:', user.id, 'isVerified:', user.isVerified);

    return NextResponse.json(
      {
        message: user.isVerified
          ? 'Account created and verified successfully'
          : 'Account created. Awaiting verification.',
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
