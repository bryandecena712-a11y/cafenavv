import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const discovered = await prisma.discoveredCafe.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(discovered);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch discovered cafes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 });
    }

    const item = await prisma.discoveredCafe.findUnique({ where: { id: Number(id) } });
    if (!item) {
      return NextResponse.json({ error: 'Discovered cafe not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Create cafe entry while safely providing fallbacks for coordinates and optional fields
      await prisma.cafes.create({
        data: {
          name: item.name,
          location: item.location || 'Calamba, Laguna',
          latitude: item.latitude ?? 14.2100,
          longitude: item.longitude ?? 121.1622,
          description: `Discovered automatically via ${item.source || 'OpenStreetMap'}.`,
          price_level: '₱₱',
          vibe: 'Chill',
          image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
          status: 'APPROVED',
        },
      });
    }

    // Always delete from queue after processing
    await prisma.discoveredCafe.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: `Cafe ${action.toLowerCase()}d successfully.` });
  } catch (error: any) {
    console.error('Action error details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}