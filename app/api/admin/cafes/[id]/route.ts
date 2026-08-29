import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    const data = await request.json();
    const { status } = data;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const cafe = await prisma.cafes.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(cafe);
  } catch (error) {
    console.error('Error updating cafe status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);

    await prisma.cafes.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cafe:', error);
    return NextResponse.json({ error: 'Failed to delete cafe' }, { status: 500 });
  }
}
