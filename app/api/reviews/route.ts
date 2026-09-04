import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { cafeId, rating, content, userId } = data;

    if (!cafeId || !rating || !content || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already reviewed this cafe
    const existingReview = await prisma.reviews.findFirst({
      where: {
        user_id: userId,
        cafe_id: cafeId,
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this cafe' }, { status: 400 });
    }

    const newReview = await prisma.reviews.create({
      data: {
        user_id: userId,
        cafe_id: cafeId,
        rating: rating,
        content: content,
      },
      include: {
        user: { select: { username: true } },
      },
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { reviewId, userId } = data;

    if (!reviewId || !userId) {
      return NextResponse.json({ error: 'Missing reviewId or userId' }, { status: 400 });
    }

    // Ensure the review exists and belongs to the user requesting deletion
    const existingReview = await prisma.reviews.findFirst({
      where: {
        id: reviewId,
        user_id: userId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized to delete' },
        { status: 404 }
      );
    }

    // Delete the review
    await prisma.reviews.delete({
      where: {
        id: reviewId,
      },
    });

    return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}