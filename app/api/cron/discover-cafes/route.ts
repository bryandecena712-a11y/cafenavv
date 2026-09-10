import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    // Geofenced Overpass API query targeting Metro Manila & Calabarzon region
    const overpassUrl =
      'https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=cafe](14.0,120.8,14.8,121.3);out;';

    const res = await fetch(overpassUrl, {
      headers: { 'User-Agent': 'CafeNavApp/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Overpass API request failed' }, { status: 500 });
    }

    const data = await res.json();
    const elements = data.elements || [];

    let count = 0;
    for (const node of elements) {
      if (!node.tags || !node.tags.name) continue;

      const osmId = `osm_${node.id}`;
      const name = node.tags.name;
      const city =
        node.tags['addr:city'] ||
        node.tags['addr:suburb'] ||
        node.tags['addr:municipality'] ||
        'Local Area';

      // Store in DB if not already present in either DiscoveredCafe or Cafes
      const existingDiscovered = await prisma.discoveredCafe.findUnique({ where: { osm_id: osmId } });
      const existingCafe = await prisma.cafes.findFirst({ where: { name: name } });

      if (!existingDiscovered && !existingCafe) {
        await prisma.discoveredCafe.create({
          data: {
            osm_id: osmId,
            name: name,
            location: city,
            latitude: node.lat,
            longitude: node.lon,
            source: 'OpenStreetMap',
          },
        });
        count++;
      }
    }

    return NextResponse.json({ message: `Scraped successfully. ${count} new cafes discovered!` });
  } catch (error) {
    console.error('Discovery Error:', error);
    return NextResponse.json({ error: 'Failed to discover cafes' }, { status: 500 });
  }
}