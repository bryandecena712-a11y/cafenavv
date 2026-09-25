import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Force dynamic execution & prevent Vercel static build evaluation crashes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      name, 
      location, 
      description, 
      price_level, 
      vibe, 
      image_url, 
      lat, 
      lng, 
      latitude, 
      longitude 
    } = data;

    if (!name || !location) {
      return NextResponse.json({ error: 'Name and location are required' }, { status: 400 });
    }

    // Extract coordinate priority (handles both lat/lng and latitude/longitude parameter names)
    const rawLat = lat ?? latitude;
    const rawLng = lng ?? longitude;

    const parsedLat = rawLat !== undefined && rawLat !== null ? parseFloat(rawLat) : null;
    const parsedLng = rawLng !== undefined && rawLng !== null ? parseFloat(rawLng) : null;

    const cafe = await prisma.cafes.create({
      data: {
        name,
        location,
        description: description || 'No description provided',
        price_level: price_level || '₱₱',
        vibe: vibe || 'chill',
        image_url: image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        lat: parsedLat,
        lng: parsedLng,
        status: 'PENDING',
      },
    });

    return NextResponse.json(cafe, { status: 201 });
  } catch (error) {
    console.error('Error suggesting cafe:', error);
    return NextResponse.json({ error: 'Failed to suggest cafe' }, { status: 500 });
  }
}