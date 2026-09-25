import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      location, 
      description, 
      price_level, 
      vibe, 
      image_url, 
      latitude, 
      longitude, 
      lat, 
      lng 
    } = body;

    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required fields' }, 
        { status: 400 }
      );
    }

    // Safely parse numerical coordinates
    const rawLat = parseFloat(lat ?? latitude ?? 14.2117);
    const rawLng = parseFloat(lng ?? longitude ?? 121.1654);
    const finalLat = isNaN(rawLat) ? 14.2117 : rawLat;
    const finalLng = isNaN(rawLng) ? 121.1654 : rawLng;

    // Standard fallback image if image_url is missing or invalid text like "test 5"
    const validImage = image_url && String(image_url).trim().startsWith('http')
      ? String(image_url).trim()
      : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';

    // Construct clean payload safely without injecting unknown columns
    const dataPayload: Record<string, any> = {
      name: String(name).trim(),
      location: String(location).trim(),
      description: description ? String(description).trim() : 'No description provided',
      price_level: price_level || '₱₱',
      vibe: vibe || 'chill',
      image_url: validImage,
      status: 'PENDING',
      rating: 0,
    };

    // Try creating with lat/lng first; fallback to latitude/longitude if model demands it
    let newCafe;
    try {
      newCafe = await prisma.cafes.create({
        data: {
          ...dataPayload,
          lat: finalLat,
          lng: finalLng,
        },
      });
    } catch (dbErr: any) {
      // Retry with latitude / longitude schema key naming
      newCafe = await prisma.cafes.create({
        data: {
          ...dataPayload,
          latitude: finalLat,
          longitude: finalLng,
        },
      });
    }

    return NextResponse.json(newCafe, { status: 201 });
  } catch (error: any) {
    console.error('Failed to submit cafe suggestion:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit cafe suggestion' },
      { status: 500 }
    );
  }
}