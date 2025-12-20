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
      try {
        const { uploadToCloudinary } = await import('@/lib/cloudinary');
        uploadedImageUrl = await uploadToCloudinary(imageUrl, 'posts');
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
      }
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
    const message = error instanceof Error ? error.message : 'Failed to create post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate userId format (basic check)
    if (userId.length < 10) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to edit posts' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const { id, caption } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Validate caption length
    if (caption && caption.length > 500) {
      return NextResponse.json({ error: 'Caption must be 500 characters or less' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own posts' }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { caption },
    });

    return NextResponse.json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to delete posts' }, { status: 401 });
    }

    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
