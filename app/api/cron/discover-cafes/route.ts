import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    // Smaller bounding box focused on Laguna/Calamba area with a 5-second timeout tag
    const overpassUrl =
      'https://overpass-api.de/api/interpreter?data=[out:json][timeout:5];node[amenity=cafe](14.15,121.10,14.25,121.25);out;';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(overpassUrl, {
      headers: { 'User-Agent': 'CafeNavApp/1.0' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: 'Overpass API request timed out or failed' }, { status: 504 });
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
        'Calamba Area';

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
    return NextResponse.json({ error: 'Failed to discover cafes due to network or timeout limits' }, { status: 500 });
  }
}