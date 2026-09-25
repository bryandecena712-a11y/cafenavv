import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Fetch all APPROVED cafes with their approved products and reviews for public view
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
  } catch (error) {
    console.error('Failed to fetch cafes:', error);
    return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 });
  }
}

// POST: Add a new cafe suggestion
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, location, description, price_level, vibe, image_url, status, latitude, longitude, lat, lng } = body;

    if (!name || !location) {
      return NextResponse.json({ error: 'Name and location are required fields' }, { status: 400 });
    }

    const dataPayload: any = {
      name,
      location,
      description: description || 'No description provided',
      price_level: price_level || '₱₱',
      vibe: vibe || 'chill',
      image_url: image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
      status: status || 'PENDING',
    };

    // Safely assign coordinates depending on schema naming
    if (latitude !== undefined) dataPayload.latitude = latitude;
    if (longitude !== undefined) dataPayload.longitude = longitude;
    if (lat !== undefined) dataPayload.lat = lat;
    if (lng !== undefined) dataPayload.lng = lng;

    const newCafe = await prisma.cafes.create({
      data: dataPayload,
    });

    return NextResponse.json(newCafe, { status: 201 });
  } catch (error) {
    console.error('Failed to create cafe suggestion:', error);
    return NextResponse.json({ error: 'Failed to submit cafe suggestion' }, { status: 500 });
  }
}

// DELETE: Remove a cafe and its associated records
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