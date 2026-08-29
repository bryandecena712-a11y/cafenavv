import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { cafeId, rating, content, userId } = data;

    if (!cafeId || !rating || !content || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Since AuthContext uses localStorage, we trust the client for now
    // Check if user already reviewed this cafe
    const existingReview = await prisma.reviews.findFirst({
      where: {
        user_id: userId,
        cafe_id: cafeId
      }
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this cafe' }, { status: 400 });
    }

    const newReview = await prisma.reviews.create({
      data: {
        user_id: userId,
        cafe_id: cafeId,
        rating: rating,
        content: content
      },
      include: {
        user: { select: { username: true } }
      }
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
