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

async function fetchCoordinates(locationName: string) {
  try {
    const query = encodeURIComponent(`${locationName}, Calamba, Laguna, Philippines`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
      headers: { 'User-Agent': 'CafeNavApp/1.0' },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (err) {
    console.error('Geocoding fallback failed:', err);
  }
  return { lat: 14.2100, lng: 121.1622 };
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
      let finalLat = item.latitude;
      let finalLng = item.longitude;

      if (!finalLat || !finalLng) {
        const geo = await fetchCoordinates(item.name || item.location);
        finalLat = geo.lat;
        finalLng = geo.lng;
      }

      // Construct base payload matching Prisma model
      const cafePayload: any = {
        name: item.name,
        location: item.location || 'Calamba, Laguna',
        description: `Discovered automatically via ${item.source || 'OpenStreetMap'}.`,
        price_level: '₱₱',
        vibe: 'chill',
        image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        status: 'APPROVED',
        // Primary coordinate naming convention for schema
        lat: finalLat,
        lng: finalLng,
      };

      await prisma.cafes.create({ data: cafePayload });
    }

    await prisma.discoveredCafe.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: `Cafe ${action.toLowerCase()}d successfully.` });
  } catch (error: any) {
    console.error('Prisma Approval Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}