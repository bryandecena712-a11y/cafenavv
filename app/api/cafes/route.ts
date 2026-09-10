import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET: Fetch all cafes with only APPROVED products for public view
export async function GET() {
  try {
    const cafes = await prisma.cafes.findMany({
      include: {
        products: {
          where: {
            status: 'APPROVED',
          },
        },
        reviews: true,
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
    const { name, location, description, price_level, vibe, image_url, status } = body;

    if (!name || !location) {
      return NextResponse.json({ error: 'Name and location are required fields' }, { status: 400 });
    }

    const newCafe = await prisma.cafes.create({
      data: {
        name,
        location,
        description: description || 'No description provided',
        price_level: price_level || '₱₱',
        vibe: vibe || 'chill',
        image_url: image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        status: status || 'PENDING',
      },
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