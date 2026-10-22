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
    const {
      name,
      location,
      description,
      price_range,
      price_level,
      priceRange,
      priceLevel,
      vibe,
      environment,
      cafe_environment,
      image_url,
      status,
      lat,
      lng,
      latitude,
      longitude,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Cafe name is required' }, { status: 400 });
    }

    const parsedLat = parseFloat(lat ?? latitude ?? 14.212231);
    const parsedLng = parseFloat(lng ?? longitude ?? 121.167516);

    // Image URL validation
    const validImageUrl =
      image_url &&
      (image_url.startsWith('http://') ||
        image_url.startsWith('https://') ||
        image_url.startsWith('data:image/'))
        ? image_url.trim()
        : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';

    const selectedPrice = price_range || price_level || priceRange || priceLevel || '₱100-300';
    const selectedVibe = vibe || 'Reading/Chill';
    const selectedEnv = environment || cafe_environment || 'Both Indoor & Outdoor';

    // Format location text safely
    const finalLocation = location || `${parsedLat}, ${parsedLng}`;

    // Strictly construct payload using ONLY validated Prisma schema fields
    const dataPayload: any = {
      name: name.trim(),
      location: finalLocation,
      description: description?.trim() || 'No description provided',
      price_level: selectedPrice,
      vibe: selectedVibe,
      image_url: validImageUrl,
      status: status || 'PENDING',
    };

    const newCafe = await prisma.cafes.create({
      data: dataPayload,
    });

    // Return extended object with user choices attached in JSON response for Admin UI
    const responseData = {
      ...newCafe,
      price_range: selectedPrice,
      environment: selectedEnv,
    };

    return NextResponse.json(responseData, { status: 201 });
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