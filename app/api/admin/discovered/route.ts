import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Fetch all pending discovered cafes
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

// Helper function to geocode location strings if exact lat/lng are missing
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
  // Default Calamba center coordinates fallback
  return { lat: 14.2100, lng: 121.1622 };
}

// POST: Approve or Dismiss a discovered cafe
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

      // If coordinates are missing from the OSM item, auto-geocode using the location name
      if (!finalLat || !finalLng) {
        const geo = await fetchCoordinates(item.name || item.location);
        finalLat = geo.lat;
        finalLng = geo.lng;
      }

      // Payload prepared for Prisma
      const cafePayload: any = {
        name: item.name,
        location: item.location || 'Calamba, Laguna',
        description: `Discovered automatically via ${item.source || 'OpenStreetMap'}.`,
        price_level: '₱₱',
        vibe: 'chill',
        image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        status: 'APPROVED',
        latitude: finalLat,
        longitude: finalLng,
      };

      await prisma.cafes.create({ data: cafePayload });
    }

    // Delete item from discovery queue after processing
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