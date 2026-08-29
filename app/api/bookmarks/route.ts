import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { cafeId, userId } = data;

    if (!cafeId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bookmark = await prisma.bookmarks.create({
      data: {
        user_id: userId,
        cafe_id: cafeId
      }
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Cafe already bookmarked' }, { status: 400 });
    }
    console.error('Error saving bookmark:', error);
    return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { cafeId, userId } = data;

    if (!cafeId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await prisma.bookmarks.deleteMany({
      where: {
        user_id: userId,
        cafe_id: cafeId
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
  }
}
