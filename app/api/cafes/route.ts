import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const { cafeId } = await request.json();

    if (!cafeId) {
      return NextResponse.json({ error: 'Cafe ID is required' }, { status: 400 });
    }

    // Delete related reviews and products first to maintain referential integrity
    await prisma.reviews.deleteMany({
      where: { cafe_id: Number(cafeId) },
    });

    await prisma.products.deleteMany({
      where: { cafe_id: Number(cafeId) },
    });

    // Delete the cafe
    await prisma.cafes.delete({
      where: { id: Number(cafeId) },
    });

    return NextResponse.json({ message: 'Cafe deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete cafe:', error);
    return NextResponse.json({ error: 'Failed to delete cafe' }, { status: 500 });
  }
}