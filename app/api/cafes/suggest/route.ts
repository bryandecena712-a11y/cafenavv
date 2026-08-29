import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, location, description, price_level, vibe, image_url } = data;

    if (!name || !location) {
      return NextResponse.json({ error: 'Name and location are required' }, { status: 400 });
    }

    const cafe = await prisma.cafes.create({
      data: {
        name,
        location,
        description,
        price_level,
        vibe,
        image_url,
        status: 'PENDING'
      }
    });

    return NextResponse.json(cafe, { status: 201 });
  } catch (error) {
    console.error('Error suggesting cafe:', error);
    return NextResponse.json({ error: 'Failed to suggest cafe' }, { status: 500 });
  }
}
