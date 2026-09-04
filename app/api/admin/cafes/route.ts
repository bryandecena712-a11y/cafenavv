import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Fetch all cafes and their products
export async function GET() {
  try {
    const cafes = await prisma.cafes.findMany({
      include: {
        products: true,
      },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(cafes);
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 });
  }
}

// Create a new cafe and its products
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, photo, description, priceLevel, vibe, pinnedLocation, products, userId } = data;

    if (!name || !photo || !description || !pinnedLocation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newCafe = await prisma.cafes.create({
      data: {
        name,
        description,
        image_url: photo,
        price_level: priceLevel,
        vibe: vibe,
        location: `${pinnedLocation.lat},${pinnedLocation.lng}`,
        products: {
          create: products.map((p: any) => ({
            name: p.name,
            price: p.price,
            description: p.description,
            image_url: p.photo || '',
          })),
        },
      },
      include: {
        products: true,
      },
    });

    // Create audit log if user ID is present
    if (userId) {
      await prisma.audit_logs.create({
        data: {
          user_id: userId,
          action: 'Added Cafe',
          target: name,
        },
      });
    }

    return NextResponse.json(newCafe, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cafe:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A cafe with this name already exists' }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Failed to create cafe' }, { status: 500 });
  }
}