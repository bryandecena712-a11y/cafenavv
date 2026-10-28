import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coffeeType = searchParams.get('type');
    const needs = searchParams.get('needs');
    const priceRange = searchParams.get('price');
    const environment = searchParams.get('environment');

    const cafes = await prisma.cafes.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        products: {
          where: {
            status: 'APPROVED',
          },
        },
        reviews: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    let filteredCafes = cafes;

    // Apply basic matching if filters are provided
    if (needs || priceRange || environment) {
      filteredCafes = cafes.filter((cafe) => {
        let matchScore = 0;

        // Vibe/Needs matching (using cafe.vibe)
        if (needs && cafe.vibe?.toLowerCase().includes(needs.toLowerCase())) {
          matchScore += 2;
        }

                // Price matching
        let priceMatch = false;
        if (priceRange === 'budget') priceMatch = cafe.price_level?.includes('100') || cafe.price_level?.includes('200') || false;
        else if (priceRange === 'moderate') priceMatch = cafe.price_level?.includes('150') || false;
        else if (priceRange === 'premium') priceMatch = cafe.price_level?.includes('500') || false;
        else if (priceRange && cafe.price_level?.toLowerCase().includes(priceRange.toLowerCase())) priceMatch = true;
        
        if (priceMatch) {
            matchScore += 1;
        }

        // Environment matching (using description tags)
        let envMatch = false;
        if (environment === 'indoor') envMatch = cafe.description?.toLowerCase().includes('indoor') || false;
        else if (environment === 'outdoor') envMatch = cafe.description?.toLowerCase().includes('outdoor') || false;
        else if (environment === 'both') envMatch = cafe.description?.toLowerCase().includes('indoor') && cafe.description?.toLowerCase().includes('outdoor') || false;
        else if (environment && cafe.description?.toLowerCase().includes(environment.toLowerCase())) envMatch = true;

        if (envMatch) {
            matchScore += 2;
        }

        // Only return if it meets at least some criteria if filters were provided
        return matchScore > 0;
      });
      
      // Sort by best match (optional, simple logic)
      filteredCafes.sort((a, b) => {
          const scoreA = (needs && a.vibe?.toLowerCase().includes(needs.toLowerCase()) ? 2 : 0) + 
                         (priceRange && a.price_level?.toLowerCase().includes(priceRange.toLowerCase()) ? 1 : 0);
          const scoreB = (needs && b.vibe?.toLowerCase().includes(needs.toLowerCase()) ? 2 : 0) + 
                         (priceRange && b.price_level?.toLowerCase().includes(priceRange.toLowerCase()) ? 1 : 0);
          return scoreB - scoreA;
      });
    }

    // Clean description tags before returning to client cards
    const cleanedCafes = filteredCafes.map((cafe) => {
      let cleanDesc = cafe.description || 'No description provided';
      cleanDesc = cleanDesc
        .replace(/\[ENV:.*?\]/g, '')
        .replace(/\[USER:.*?\]/g, '')
        .trim();

      return {
        ...cafe,
        description: cleanDesc,
      };
    });

    return NextResponse.json(cleanedCafes);
  } catch (error: any) {
    console.error('Failed to fetch cafes:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch cafes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      userId,
      name,
      location,
      description,
      price_range,
      price_level,
      vibe,
      environment,
      image_url,
      status,
      lat,
      lng,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Cafe name is required' }, { status: 400 });
    }

    const parsedLat = parseFloat(lat ?? 14.212231);
    const parsedLng = parseFloat(lng ?? 121.167516);

    const validImageUrl =
      image_url &&
      (image_url.startsWith('http://') ||
        image_url.startsWith('https://') ||
        image_url.startsWith('data:image/'))
        ? image_url.trim()
        : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';

    const selectedPrice = price_range || price_level || '₱100-300';
    const selectedVibe = vibe || 'Reading/Chill';
    const selectedEnv = environment || 'Both Indoor & Outdoor';
    const submitterId = user_id || userId;

    const cleanDesc = description?.trim() || 'No description provided';
    const finalDescription = `${cleanDesc} [ENV:${selectedEnv}]${submitterId ? ` [USER:${submitterId}]` : ''}`;

    const dataPayload: any = {
      name: name.trim(),
      location: location || `${parsedLat}, ${parsedLng}`,
      description: finalDescription,
      price_level: selectedPrice,
      vibe: selectedVibe,
      image_url: validImageUrl,
      status: status || 'PENDING',
    };

    const newCafe = await prisma.cafes.create({
      data: dataPayload,
    });

    return NextResponse.json(newCafe, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create cafe suggestion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit cafe suggestion' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { cafeId } = await request.json();

    if (!cafeId) {
      return NextResponse.json({ error: 'Cafe ID is required' }, { status: 400 });
    }

    await prisma.reviews.deleteMany({
      where: { cafe_id: Number(cafeId) },
    });

    await prisma.products.deleteMany({
      where: { cafe_id: Number(cafeId) },
    });

    await prisma.cafes.delete({
      where: { id: Number(cafeId) },
    });

    return NextResponse.json({ message: 'Cafe deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete cafe:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete cafe' }, { status: 500 });
  }
}