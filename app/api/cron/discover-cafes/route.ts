import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    // Fast area-based query targeting Calamba specifically via Kumi Systems Overpass Mirror
    const query = `[out:json][timeout:15];
      area["name"="Calamba"]->.searchArea;
      (
        node["amenity"="cafe"](area.searchArea);
        node["shop"="coffee"](area.searchArea);
      );
      out body;`;

    const overpassUrl = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`;

    const res = await fetch(overpassUrl, {
      headers: { 
        'User-Agent': 'CafeNavApp/1.0 (Student Project)',
        'Accept': 'application/json' 
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Overpass mirror returned status ${res.status}` }, { status: 502 });
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
        node.tags['addr:street'] ||
        'Calamba, Laguna';

      // Ensure no duplicates exist in either table
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
    return NextResponse.json({ error: 'Failed to complete discovery search' }, { status: 500 });
  }
}