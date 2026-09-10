import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Extends execution limit on Vercel

export async function POST() {
  try {
    // Calamba Bounding Box [south, west, north, east]
    const overpassQuery = `
      [out:json][timeout:15];
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

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    // Fetch existing names to prevent duplicates
    const [existingApproved, existingDiscovered] = await Promise.all([
      prisma.cafes.findMany({ select: { name: true } }),
      prisma.discoveredCafe.findMany({ select: { name: true } }),
    ]);

    const existingNames = new Set([
      ...existingApproved.map((c: { name: string }) => c.name.toLowerCase().trim()),
      ...existingDiscovered.map((c: { name: string }) => c.name.toLowerCase().trim()),
    ]);

    // Build payload in memory
    const toInsert: Array<{
      name: string;
      location: string;
      source: string;
      latitude: number;
      longitude: number;
    }> = [];

    for (const element of elements) {
      const name = element.tags?.name;
      if (!name) continue;

      const cleanName = name.trim();
      if (existingNames.has(cleanName.toLowerCase())) continue;

      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;

      if (!lat || !lon) continue;

      toInsert.push({
        name: cleanName,
        location: `${lat}, ${lon}`,
        source: 'OpenStreetMap',
        latitude: lat,
        longitude: lon,
      });

      existingNames.add(cleanName.toLowerCase());
    }

    // Single batch database insert
    if (toInsert.length > 0) {
      await prisma.discoveredCafe.createMany({
        data: toInsert,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      message: `Sync complete. ${toInsert.length} new cafes added to pending discovery.`,
      newCount: toInsert.length,
    });
  } catch (error: any) {
    console.error('OSM Fetch Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch cafes from OpenStreetMap' },
      { status: 500 }
    );
  }
}