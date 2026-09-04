import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const cafeId = parseInt(params.id, 10);
    if (isNaN(cafeId)) {
      return NextResponse.json({ error: 'Invalid cafe ID' }, { status: 400 });
    }

    const data = await request.json();
    const { name, price, description, image_url } = data;

    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const product = await prisma.products.create({
      data: {
        cafe_id: cafeId,
        name,
        price,
        description,
        image_url,
        status: 'PENDING'
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error suggesting product:', error);
    return NextResponse.json({ error: 'Failed to suggest product' }, { status: 500 });
  }
}
