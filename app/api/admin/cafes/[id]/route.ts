import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Force dynamic runtime execution & prevent static prerender build crashes
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams?.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid cafe ID' }, { status: 400 });
    }

    const data = await request.json();
    const {
      status,
      name,
      location,
      description,
      price_level,
      vibe,
      image_url,
      lat,
      lng,
      // New About Page & Operating Schedule fields
      service_options,
      offerings,
      facebook_url,
      instagram_url,
      tiktok_url,
      website_url,
      operating_hours,
    } = data;

    // Build dynamic update payload to prevent overriding existing values with undefined
    const updateData: Record<string, any> = {};

    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name.trim();
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description.trim();
    if (price_level !== undefined) updateData.price_level = price_level;
    if (vibe !== undefined) updateData.vibe = vibe;
    if (lat !== undefined) updateData.lat = parseFloat(lat);
    if (lng !== undefined) updateData.lng = parseFloat(lng);

    // Handle About page fields
    if (service_options !== undefined) {
      updateData.service_options = Array.isArray(service_options)
        ? JSON.stringify(service_options)
        : service_options;
    }
    if (offerings !== undefined) {
      updateData.offerings = Array.isArray(offerings)
        ? JSON.stringify(offerings)
        : offerings;
    }
    if (facebook_url !== undefined) updateData.facebook_url = facebook_url.trim();
    if (instagram_url !== undefined) updateData.instagram_url = instagram_url.trim();
    if (tiktok_url !== undefined) updateData.tiktok_url = tiktok_url.trim();
    if (website_url !== undefined) updateData.website_url = website_url.trim();

    // Handle Operating Hours Schedule
    if (operating_hours !== undefined) {
      updateData.operating_hours = typeof operating_hours === 'object'
        ? JSON.stringify(operating_hours)
        : operating_hours;
    }

    if (image_url !== undefined) {
      const validImageUrl =
        image_url &&
        (image_url.startsWith('http://') ||
          image_url.startsWith('https://') ||
          image_url.startsWith('data:image/'))
          ? image_url.trim()
          : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';
      updateData.image_url = validImageUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
    }

    const updatedCafe = await prisma.cafes.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedCafe);
  } catch (error: any) {
    console.error('Error updating cafe:', error);
    return NextResponse.json({ error: error.message || 'Failed to update cafe' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams?.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid cafe ID' }, { status: 400 });
    }

    // Clean up relations first to prevent Prisma Foreign Key constraint errors
    await prisma.reviews.deleteMany({
      where: { cafe_id: id },
    });

    await prisma.products.deleteMany({
      where: { cafe_id: id },
    });

    await prisma.cafes.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Cafe deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cafe:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete cafe' }, { status: 500 });
  }
}