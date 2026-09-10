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
      // Store accurate coordinates inside location if db schema lacks lat/lng columns
      const rawLat = item.latitude;
      const rawLng = item.longitude;
      
      let formattedLocation = item.location || 'Calamba, Laguna';
      if (rawLat && rawLng) {
        formattedLocation = `${rawLat}, ${rawLng}`;
      }

      const basePayload: any = {
        name: item.name,
        location: formattedLocation,
        description: `Discovered automatically via ${item.source || 'OpenStreetMap'}.`,
        price_level: '₱₱',
        vibe: 'chill',
        image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        status: 'APPROVED',
      };

      // Try schema fields in order, falling back cleanly to coordinate location string
      try {
        await prisma.cafes.create({
          data: {
            ...basePayload,
            latitude: rawLat ?? undefined,
            longitude: rawLng ?? undefined,
          },
        });
      } catch (e1) {
        try {
          await prisma.cafes.create({
            data: {
              ...basePayload,
              lat: rawLat ?? undefined,
              lng: rawLng ?? undefined,
            },
          });
        } catch (e2) {
          await prisma.cafes.create({
            data: basePayload,
          });
        }
      }
    }

    await prisma.discoveredCafe.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: `Cafe ${action.toLowerCase()}d successfully.` });
  } catch (error: any) {
    console.error('Approval Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}