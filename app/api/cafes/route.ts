import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const price = searchParams.get('price');
    const vibe = searchParams.get('vibe');

    const where: any = { status: 'APPROVED' };
    if (price) where.price_level = price;
    if (vibe) where.vibe = vibe;

    const cafes = await prisma.cafes.findMany({
      where,
      orderBy: { id: 'desc' }
    });
    
    return NextResponse.json(cafes);
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 });
  }
}
