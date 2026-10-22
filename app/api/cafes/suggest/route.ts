import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      name,
      location,
      description,
      price_range,
      price_level,
      vibe,
      environment,
      image_url,
    } = data;

    if (!name || !location) {
      return NextResponse.json({ error: 'Name and location are required' }, { status: 400 });
    }

    const selectedPrice = price_range || price_level || '₱100-300';

    const cafe = await prisma.cafes.create({
      data: {
        name: name.trim(),
        location,
        description: description?.trim() || 'No description provided',
        price_level: selectedPrice,
        price_range: selectedPrice,
        vibe: vibe || 'Reading/Chill',
        environment: environment || 'Both Indoor & Outdoor',
        image_url: image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        status: 'PENDING',
      } as any,
    });

    return NextResponse.json(cafe, { status: 201 });
  } catch (error: any) {
    console.error('Error suggesting cafe:', error);
    return NextResponse.json({ error: error.message || 'Failed to suggest cafe' }, { status: 500 });
  }
}