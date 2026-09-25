import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cafes = await prisma.cafes.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        products: {
          where: {
            status: 'APPROVED',
          },
        },
        reviews: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return NextResponse.json(cafes);
  } catch (error: any) {
    console.error('Failed to fetch cafes:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch cafes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, location, description, price_level, vibe, image_url, status, latitude, longitude, lat, lng } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Cafe name is required' }, { status: 400 });
    }

    const parsedLat = parseFloat(lat ?? latitude ?? 14.212231);
    const parsedLng = parseFloat(lng ?? longitude ?? 121.167516);

    const validImageUrl =
      image_url && (image_url.startsWith('http://') || image_url.startsWith('https://'))
        ? image_url.trim()
        : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';

    // Strict base payload using standard Prisma schema fields
    const dataPayload: Record<string, any> = {
      name: name.trim(),
      location: location || `${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`,
      description: description?.trim() || 'No description provided',
      price_level: price_level || '₱₱',
      vibe: vibe || 'chill',
      image_url: validImageUrl,
      status: status || 'PENDING',
    };

    // Safely attach parsed numerical coordinates
    if (lat !== undefined || latitude !== undefined) {
      dataPayload.lat = parsedLat;
    }
    if (lng !== undefined || longitude !== undefined) {
      dataPayload.lng = parsedLng;
    }

    const newCafe = await prisma.cafes.create({
      data: dataPayload as any,
    });

    return NextResponse.json(newCafe, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create cafe suggestion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit cafe suggestion' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { cafeId } = await request.json();

    if (!cafeId) {
      return NextResponse.json({ error: 'Cafe ID is required' }, { status: 400 });
    }

    await prisma.reviews.deleteMany({
      where: { cafe_id: Number(cafeId) },
    });

    await prisma.products.deleteMany({
      where: { cafe_id: Number(cafeId) },
    });

    await prisma.cafes.delete({
      where: { id: Number(cafeId) },
    });

    return NextResponse.json({ message: 'Cafe deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete cafe:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete cafe' }, { status: 500 });
  }
}