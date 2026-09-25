import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cafes = await prisma.cafes.findMany({
      where: {
        OR: [
          { status: 'APPROVED' },
          { status: 'ACTIVE' },
          { status: 'approved' },
          { status: 'active' },
        ],
      },
      include: {
        products: {
          where: { status: 'APPROVED' },
        },
        reviews: true,
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(cafes);
  } catch (error: any) {
    console.error('Failed to fetch cafes:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch cafes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, location, description, price_level, vibe, image_url, latitude, longitude, lat, lng } = body;

    if (!name || !location) {
      return NextResponse.json({ error: 'Name and location are required fields' }, { status: 400 });
    }

    // Safely parse numbers to prevent NaN database errors
    const parsedLat = parseFloat(lat ?? latitude ?? 14.2117);
    const parsedLng = parseFloat(lng ?? longitude ?? 121.1654);
    const finalLat = isNaN(parsedLat) ? 14.2117 : parsedLat;
    const finalLng = isNaN(parsedLng) ? 121.1654 : parsedLng;

    // Use default fallback if image URL isn't a valid HTTP link
    const validImage = image_url && String(image_url).trim().startsWith('http')
      ? String(image_url).trim()
      : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';

    const dataPayload: any = {
      name: String(name).trim(),
      location: String(location).trim(),
      description: description ? String(description).trim() : 'No description provided',
      price_level: price_level || '₱₱',
      vibe: vibe || 'chill',
      image_url: validImage,
      status: 'PENDING',
      latitude: finalLat,
      longitude: finalLng,
      lat: finalLat,
      lng: finalLng,
    };

    const newCafe = await prisma.cafes.create({
      data: dataPayload,
    });

    return NextResponse.json(newCafe, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create cafe suggestion:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit cafe suggestion' },
      { status: 500 }
    );
  }
}