import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, caption } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    let uploadedImageUrl = imageUrl;
    if (imageUrl.startsWith('data:')) {
      const { uploadToCloudinary } = await import('@/lib/cloudinary');
      uploadedImageUrl = await uploadToCloudinary(imageUrl, 'posts');
    }

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        imageUrl: uploadedImageUrl,
        caption: caption || null,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
