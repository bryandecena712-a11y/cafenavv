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

    // Parse coordinates safely
    const parsedLat = parseFloat(lat ?? latitude ?? 14.2117);
    const parsedLng = parseFloat(lng ?? longitude ?? 121.1654);

    const finalLat = isNaN(parsedLat) ? 14.2117 : parsedLat;
    const finalLng = isNaN(parsedLng) ? 121.1654 : parsedLng;

    // Build base payload with proper fallbacks
    const dataPayload: any = {
      name: String(name).trim(),
      location: String(location).trim(),
      description: description ? String(description).trim() : 'No description provided',
      price_level: price_level || '₱₱',
      vibe: vibe || 'chill',
      image_url: image_url && String(image_url).trim().startsWith('http')
        ? String(image_url).trim()
        : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
      status: 'PENDING',
      lat: finalLat,
      lng: finalLng,
      latitude: finalLat,
      longitude: finalLng,
    };

    const newSuggestion = await prisma.cafes.create({
      data: dataPayload,
    });

    return NextResponse.json(newSuggestion, { status: 201 });
  } catch (error: any) {
    console.error('Failed to submit cafe suggestion:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit cafe suggestion' },
      { status: 500 }
    );
  }
}