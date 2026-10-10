import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { cafeId, rating, content, userId, image_url } = data;

    if (!cafeId || !rating || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedCafeId = Number(cafeId);
    const parsedRating = Number(rating);
    const parsedUserId = userId ? Number(userId) : null;

    // Build payload safely to avoid TypeScript Prisma schema type checks
    const reviewData: Record<string, any> = {
      cafe_id: parsedCafeId,
      rating: parsedRating,
      content: String(content),
    };

    if (image_url) {
      reviewData.image_url = String(image_url);
    }

    if (parsedUserId) {
      reviewData.user_id = parsedUserId;
    }

    // Create the review (Allows multiple reviews per user)
    const newReview = await prisma.reviews.create({
      data: reviewData as any,
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    try {
      revalidatePath(`/cafe/${parsedCafeId}`);
    } catch {
      // Ignore cache invalidation warnings in edge runtime
    }

    return NextResponse.json(newReview, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create review' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { reviewId, userId } = data;

    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }

    const parsedReviewId = Number(reviewId);
    const parsedUserId = userId ? Number(userId) : null;

    const existingReview = await prisma.reviews.findUnique({
      where: { id: parsedReviewId },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (parsedUserId && existingReview.user_id && existingReview.user_id !== parsedUserId) {
      return NextResponse.json({ error: 'Unauthorized to delete this review' }, { status: 403 });
    }

    await prisma.reviews.delete({
      where: { id: parsedReviewId },
    });

    return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}