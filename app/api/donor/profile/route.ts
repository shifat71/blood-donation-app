import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BloodGroup } from '@prisma/client';

// GET donor profile
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const donorProfile = await prisma.donorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            isVerified: true,
          },
        },
      },
    });

    if (!donorProfile) {
      return NextResponse.json(
        { error: 'Donor profile not found' },
        { status: 404 }
      );
    }

    console.log('Fetched donor profile with profilePicture:', donorProfile.profilePicture);
    return NextResponse.json(donorProfile);
  } catch (error) {
    console.error('Error fetching donor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create donor profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bloodGroup, phoneNumber, address, studentId, lastDonationDate, profilePicture, currentDistrict, department, session: academicSession } = body;

    // Validate blood group
    if (!bloodGroup || !Object.values(BloodGroup).includes(bloodGroup)) {
      return NextResponse.json(
        { error: 'Invalid blood group' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.donorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Donor profile already exists' },
        { status: 400 }
      );
    }

    let uploadedImageUrl = null;
    if (profilePicture && profilePicture.startsWith('data:')) {
      // It's a base64 image, upload to Cloudinary
      try {
        const { uploadToCloudinary } = await import('@/lib/cloudinary');
        uploadedImageUrl = await uploadToCloudinary(profilePicture, 'profile-pictures');
        console.log('Profile picture uploaded to Cloudinary:', uploadedImageUrl);
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return NextResponse.json(
          { error: 'Failed to upload profile picture' },
          { status: 500 }
        );
      }
    } else if (profilePicture && profilePicture.startsWith('http')) {
      // It's already a URL, use it directly
      uploadedImageUrl = profilePicture;
    }

    const autoAvailability = !lastDonationDate || (Date.now() - new Date(lastDonationDate).getTime()) >= 90 * 24 * 60 * 60 * 1000;

    // Create donor profile
    const donorProfile = await prisma.donorProfile.create({
      data: {
        userId: session.user.id,
        bloodGroup,
        phoneNumber,
        address,
        studentId,
        lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
        isAvailable: autoAvailability,
        profilePicture: uploadedImageUrl,
        currentDistrict: currentDistrict || 'Sylhet',
        department,
        session: academicSession,
      },
    });

    console.log('Donor profile created with profilePicture:', donorProfile.profilePicture);
    return NextResponse.json(donorProfile, { status: 201 });
  } catch (error) {
    console.error('Error creating donor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update donor profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bloodGroup, phoneNumber, address, studentId, lastDonationDate, isAvailable, profilePicture, currentDistrict, department, session: academicSession } = body;

    // Find existing profile
    const existingProfile = await prisma.donorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Donor profile not found' },
        { status: 404 }
      );
    }

    let uploadedImageUrl = existingProfile.profilePicture;
    if (profilePicture && profilePicture.startsWith('data:')) {
      // It's a new base64 image, upload to Cloudinary
      try {
        const { uploadToCloudinary } = await import('@/lib/cloudinary');
        uploadedImageUrl = await uploadToCloudinary(profilePicture, 'profile-pictures');
        console.log('Profile picture uploaded to Cloudinary:', uploadedImageUrl);
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return NextResponse.json(
          { error: 'Failed to upload profile picture' },
          { status: 500 }
        );
      }
    } else if (profilePicture && profilePicture.startsWith('http')) {
      // It's already a URL (existing image), keep it
      uploadedImageUrl = profilePicture;
    }

    const donationDateToCheck = lastDonationDate !== undefined ? lastDonationDate : existingProfile.lastDonationDate;
    const autoAvailability = !donationDateToCheck || (Date.now() - new Date(donationDateToCheck).getTime()) >= 90 * 24 * 60 * 60 * 1000;

    // Determine availability: use manual setting if provided, otherwise auto-calculate only when donation date changes
    let finalAvailability = existingProfile.isAvailable;
    if (isAvailable !== undefined) {
      // Manual override - but can't set to available if within 90 days of last donation
      if (isAvailable === true && !autoAvailability) {
        return NextResponse.json(
          { error: 'Cannot mark as available. Must wait 90 days after last donation.' },
          { status: 400 }
        );
      }
      finalAvailability = isAvailable;
    } else if (lastDonationDate !== undefined) {
      // Auto-calculate when donation date is updated
      finalAvailability = autoAvailability;
    }

    // Update profile
    const updatedProfile = await prisma.donorProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(bloodGroup && { bloodGroup }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(studentId !== undefined && { studentId }),
        ...(lastDonationDate !== undefined && { 
          lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null 
        }),
        isAvailable: finalAvailability,
        ...(uploadedImageUrl !== existingProfile.profilePicture && { profilePicture: uploadedImageUrl }),
        ...(currentDistrict !== undefined && { currentDistrict }),
        ...(department !== undefined && { department }),
        ...(academicSession !== undefined && { session: academicSession }),
      },
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

    console.log('Profile updated with profilePicture:', updatedProfile.profilePicture);
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating donor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
