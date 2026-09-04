import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Fetch a single cafe by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cafeId = Number(id);

    if (!cafeId || isNaN(cafeId)) {
      return NextResponse.json({ error: 'Invalid Cafe ID' }, { status: 400 });
    }

    const cafe = await prisma.cafes.findUnique({
      where: { id: cafeId },
      include: { products: true },
    });

    if (!cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    return NextResponse.json(cafe);
  } catch (error) {
    console.error('Error fetching cafe:', error);
    return NextResponse.json({ error: 'Failed to fetch cafe' }, { status: 500 });
  }
}

// Update cafe status (e.g., Approve pending cafe)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cafeId = Number(id);
    const body = await request.json();

    if (!cafeId || isNaN(cafeId)) {
      return NextResponse.json({ error: 'Invalid Cafe ID' }, { status: 400 });
    }

    const updatedCafe = await prisma.cafes.update({
      where: { id: cafeId },
      data: { status: body.status },
    });

    return NextResponse.json(updatedCafe);
  } catch (error) {
    console.error('Error updating cafe:', error);
    return NextResponse.json({ error: 'Failed to update cafe' }, { status: 500 });
  }
}

// Delete a cafe and its associated records
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cafeId = Number(id);

    if (!cafeId || isNaN(cafeId)) {
      return NextResponse.json({ error: 'Invalid Cafe ID' }, { status: 400 });
    }

    // Delete related records first to prevent Foreign Key constraint errors
    await prisma.reviews.deleteMany({
      where: { cafe_id: cafeId },
    });

    await prisma.products.deleteMany({
      where: { cafe_id: cafeId },
    });

    // Delete the cafe entry
    await prisma.cafes.delete({
      where: { id: cafeId },
    });

    return NextResponse.json({ message: 'Cafe deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting cafe:', error);
    return NextResponse.json({ error: 'Failed to delete cafe' }, { status: 500 });
  }
}