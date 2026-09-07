import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Fetch Pending Menu Suggestions for Admin
export async function GET() {
  try {
    const pendingProducts = await prisma.products.findMany({
      where: { status: 'PENDING' },
      include: { cafe: true },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(pendingProducts, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending products:', error);
    return NextResponse.json({ error: 'Failed to fetch pending products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { cafeId, name, price, description, image_url } = data;

    if (!cafeId || !name || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.products.create({
      data: {
        cafe_id: parseInt(cafeId, 10),
        name,
        // ==========================================
        // FIXED CODE: Ensure price is stored cleanly as string/number
        // ==========================================
        price: String(price),
        description: description || null,
        image_url: image_url || null,
        status: 'PENDING',
        // ==========================================
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json({ error: 'Product ID and status are required' }, { status: 400 });
    }

    const product = await prisma.products.update({
      where: { id: parseInt(id, 10) },
      data: { status }
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await prisma.products.delete({
      where: { id: parseInt(id, 10) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}