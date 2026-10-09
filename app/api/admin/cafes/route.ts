import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Force dynamic execution & prevent Vercel static build evaluation crashes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fetch all cafes and their products
export async function GET() {
  try {
    const cafes = await prisma.cafes.findMany({
      include: {
        products: true,
      },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(cafes);
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 });
  }
}

// Create a new cafe and its products
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Support both client payload formats seamlessly
    const name = data.name?.trim();
    const photo = data.photo || data.image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';
    const description = data.description?.trim() || 'No description provided';
    const priceLevel = data.priceLevel || data.price_level || '₱₱';
    const vibe = data.vibe || 'chill';
    
    // Default to APPROVED for cafes published via admin creation
    const status = data.status || 'APPROVED';
    const userId = data.userId || null;
    const products = data.products || [];

    // Extract latitude and longitude flexibly from pinnedLocation or flat lat/lng fields
    let latVal: number | null = null;
    let lngVal: number | null = null;

    if (data.pinnedLocation && typeof data.pinnedLocation === 'object') {
      latVal = parseFloat(data.pinnedLocation.lat);
      lngVal = parseFloat(data.pinnedLocation.lng);
    } else if (data.lat !== undefined && data.lng !== undefined) {
      latVal = parseFloat(data.lat);
      lngVal = parseFloat(data.lng);
    }

    if (!name) {
      return NextResponse.json({ error: 'Cafe name is required' }, { status: 400 });
    }

    // Format location string safely
    const locationStr =
      data.location ||
      (latVal !== null && lngVal !== null && !isNaN(latVal) && !isNaN(lngVal)
        ? `${latVal.toFixed(4)}, ${lngVal.toFixed(4)}`
        : 'Calamba, Laguna');

    // Build Prisma creation data matching exact Prisma Schema fields
    const createData: any = {
      name,
      description,
      image_url: photo,
      price_level: priceLevel,
      vibe,
      location: locationStr,
      status,
    };

    // Include nested product creation if products array is provided
    if (Array.isArray(products) && products.length > 0) {
      createData.products = {
        create: products.map((p: any) => ({
          name: p.name,
          price: String(p.price || 0), // Prisma schema expects price as String
          description: p.description || '',
          image_url: p.photo || p.image_url || '',
          status: 'APPROVED',
        })),
      };
    }

    const newCafe = await prisma.cafes.create({
      data: createData,
      include: {
        products: true,
      },
    });

    // Create audit log if user ID is present
    if (userId) {
      try {
        await prisma.audit_logs.create({
          data: {
            user_id: Number(userId),
            action: 'Added Cafe',
            target: name,
          },
        });
      } catch (auditErr) {
        console.warn('Failed to write audit log:', auditErr);
      }
    }

    return NextResponse.json(newCafe, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cafe:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A cafe with this name already exists' }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create cafe' },
      { status: 500 }
    );
  }
}