import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Calamba Bounding Box [south, west, north, east]
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="cafe"](14.15,121.05,14.25,121.20);
        way["amenity"="cafe"](14.15,121.05,14.25,121.20);
      );
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    const data = await response.json();
    const elements = data.elements || [];

    // Fetch existing cafe names to prevent duplicates
    const existingApproved = await prisma.cafes.findMany({ select: { name: true } });
    const existingDiscovered = await prisma.discoveredCafe.findMany({ select: { name: true } });

    // Explicitly type 'c' to fix TypeScript TS7006 error
    const existingNames = new Set([
      ...existingApproved.map((c: { name: string }) => c.name.toLowerCase().trim()),
      ...existingDiscovered.map((c: { name: string }) => c.name.toLowerCase().trim()),
    ]);

    let newCount = 0;

    for (const element of elements) {
      const name = element.tags?.name;
      if (!name) continue;

      const cleanName = name.trim();
      if (existingNames.has(cleanName.toLowerCase())) continue;

      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;

      if (!lat || !lon) continue;

      await prisma.discoveredCafe.create({
        data: {
          name: cleanName,
          location: `${lat}, ${lon}`,
          source: 'OpenStreetMap',
          latitude: lat,
          longitude: lon,
        },
      });

      existingNames.add(cleanName.toLowerCase());
      newCount++;
    }

    return NextResponse.json({
      message: `Sync complete. ${newCount} new cafes added to pending discovery.`,
      newCount,
    });
  } catch (error: any) {
    console.error('OSM Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch cafes from OpenStreetMap' }, { status: 500 });
  }
}