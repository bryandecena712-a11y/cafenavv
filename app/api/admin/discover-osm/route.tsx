import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// List of Overpass API mirrors to handle rate limits and timeouts
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

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

    let responseData: any = null;
    let fetchError: string | null = null;

    // Try fetching from available Overpass API endpoints until one succeeds
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const params = new URLSearchParams();
        params.append('data', overpassQuery);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'User-Agent': 'CafeNavApp/1.0 (contact@cafenav.com)',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: AbortSignal.timeout(12000), // 12-second timeout per server
        });

        if (res.ok) {
          responseData = await res.json();
          break; // Success! Break out of loop
        }
      } catch (err: any) {
        fetchError = err.message;
        console.warn(`Failed to fetch from ${endpoint}, trying next endpoint...`);
      }
    }

    if (!responseData || !responseData.elements) {
      return NextResponse.json(
        { error: 'OpenStreetMap servers are currently busy. Please wait a minute and try again.' },
        { status: 503 }
      );
    }

    const elements = responseData.elements || [];

    // Fetch existing names to avoid duplicates
    const [existingApproved, existingDiscovered] = await Promise.all([
      prisma.cafes.findMany({ select: { name: true } }),
      prisma.discoveredCafe.findMany({ select: { name: true } }),
    ]);

    const existingNames = new Set([
      ...existingApproved.map((c: { name: string }) => c.name.toLowerCase().trim()),
      ...existingDiscovered.map((c: { name: string }) => c.name.toLowerCase().trim()),
    ]);

    let newCount = 0;

    // Safely insert items into the database one by one
    for (const element of elements) {
      const name = element.tags?.name;
      if (!name) continue;

      const cleanName = name.trim();
      if (existingNames.has(cleanName.toLowerCase())) continue;

      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;

      if (!lat || !lon) continue;

      try {
        await prisma.discoveredCafe.create({
          data: {
            name: cleanName,
            location: `${lat}, ${lon}`,
            source: 'OpenStreetMap',
            latitude: Number(lat),
            longitude: Number(lon),
          },
        });

        existingNames.add(cleanName.toLowerCase());
        newCount++;
      } catch (dbErr) {
        console.error(`Skipping insert for ${cleanName}:`, dbErr);
      }
    }

    return NextResponse.json({
      message: `Sync complete. ${newCount} new cafes added to pending discovery.`,
      newCount,
    });
  } catch (error: any) {
    console.error('OSM Fetch Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process OpenStreetMap data' },
      { status: 500 }
    );
  }
}