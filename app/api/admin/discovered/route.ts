import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET: Fetch all discovered pending cafes
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

// POST: Approve or Dismiss a discovered cafe
export async function POST(request: Request) {
  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 });
    }

    const item = await prisma.discoveredCafe.findUnique({ where: { id: Number(id) } });
    if (!item) {
      return NextResponse.json({ error: 'Discovered cafe not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Transfer to main cafes table
      await prisma.cafes.create({
        data: {
          name: item.name,
          location: item.location,
          description: `Discovered automatically via ${item.source}.`,
          price_level: '₱₱',
          vibe: 'chill',
          image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
          status: 'APPROVED',
        },
      });
    }

    // Remove from discovered queue regardless of APPROVE or DISMISS
    await prisma.discoveredCafe.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: `Cafe ${action.toLowerCase()}d successfully.` });
  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}