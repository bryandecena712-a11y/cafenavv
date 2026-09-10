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
      // Build safe fallback object matching Prisma Cafe fields flexible for lat/lng or latitude/longitude
      const cafeData: any = {
        name: item.name,
        location: item.location || 'Calamba, Laguna',
        description: `Discovered automatically via ${item.source || 'OpenStreetMap'}.`,
        price_level: '₱₱',
        vibe: 'Chill',
        image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        status: 'APPROVED',
      };

      // Handle both possible coordinate column naming conventions
      if ('latitude' in (prisma.cafes as any).fields) {
        cafeData.latitude = item.latitude ?? 14.2100;
        cafeData.longitude = item.longitude ?? 121.1622;
      } else if ('lat' in (prisma.cafes as any).fields) {
        cafeData.lat = item.latitude ?? 14.2100;
        cafeData.lng = item.longitude ?? 121.1622;
      }

      await prisma.cafes.create({ data: cafeData });
    }

    // Remove from queue after processing
    await prisma.discoveredCafe.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: `Cafe ${action.toLowerCase()}d successfully.` });
  } catch (error: any) {
    console.error('Prisma Approval Error:', error);
    // Return explicit error details to pinpoint schema mismatch
    return NextResponse.json(
      { error: error?.message || 'Failed to insert cafe into database' },
      { status: 500 }
    );
  }
}