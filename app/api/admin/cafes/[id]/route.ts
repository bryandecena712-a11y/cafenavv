import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Force dynamic runtime execution & prevent static prerender build crashes
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams?.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid cafe ID' }, { status: 400 });
    }

    const data = await request.json();
    const { status } = data;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updatedCafe = await prisma.cafes.update({
      where: { id },
      data: { 
        status: String(status).toUpperCase().trim() 
      },
    });

    return NextResponse.json(updatedCafe);
  } catch (error: any) {
    console.error('Error updating cafe status:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update status' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams?.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid cafe ID' }, { status: 400 });
    }

    // Safely remove associated reviews and products first to maintain referential integrity
    await prisma.reviews.deleteMany({
      where: { cafe_id: id },
    });

    await prisma.products.deleteMany({
      where: { cafe_id: id },
    });

    // Delete the target cafe
    await prisma.cafes.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Cafe and related items deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cafe:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete cafe' }, 
      { status: 500 }
    );
  }
}