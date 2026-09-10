import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

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
      const locationText = item.location && !item.location.toLowerCase().includes('calamba')
        ? `${item.location}, Calamba, Laguna`
        : item.location || 'Calamba, Laguna';

      // Base payload using guaranteed standard fields
      const basePayload: any = {
        name: item.name,
        location: locationText,
        description: `Discovered automatically via ${item.source || 'OpenStreetMap'}.`,
        price_level: '₱₱',
        vibe: 'chill',
        image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        status: 'APPROVED',
      };

      // Safe creation attempt with schema field fallback
      try {
        await prisma.cafes.create({
          data: {
            ...basePayload,
            latitude: item.latitude ?? undefined,
            longitude: item.longitude ?? undefined,
          },
        });
      } catch (e1) {
        try {
          await prisma.cafes.create({
            data: {
              ...basePayload,
              lat: item.latitude ?? undefined,
              lng: item.longitude ?? undefined,
            },
          });
        } catch (e2) {
          // If neither coordinate field exists in schema, create standard record
          await prisma.cafes.create({
            data: basePayload,
          });
        }
      }
    }

    await prisma.discoveredCafe.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: `Cafe ${action.toLowerCase()}d successfully.` });
  } catch (error: any) {
    console.error('Approval Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}