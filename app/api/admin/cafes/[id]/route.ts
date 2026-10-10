import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

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
      service_options,
      offerings,
      facebook_url,
      instagram_url,
      tiktok_url,
      website_url,
      operating_hours,
    } = data;

    const updateData: Record<string, any> = {};

    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price_level !== undefined) updateData.price_level = price_level;
    if (vibe !== undefined) updateData.vibe = vibe;

    // Convert latitude and longitude into location string
    if (lat !== undefined && lng !== undefined && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      updateData.location = `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
    } else if (location !== undefined) {
      updateData.location = location;
    }

    if (service_options !== undefined) {
      updateData.service_options = typeof service_options === 'object' ? JSON.stringify(service_options) : service_options;
    }
    if (offerings !== undefined) {
      updateData.offerings = typeof offerings === 'object' ? JSON.stringify(offerings) : offerings;
    }
    if (facebook_url !== undefined) updateData.facebook_url = facebook_url.trim();
    if (instagram_url !== undefined) updateData.instagram_url = instagram_url.trim();
    if (tiktok_url !== undefined) updateData.tiktok_url = tiktok_url.trim();
    if (website_url !== undefined) updateData.website_url = website_url.trim();

    if (operating_hours !== undefined) {
      updateData.operating_hours = typeof operating_hours === 'object' ? JSON.stringify(operating_hours) : operating_hours;
    }

    if (image_url !== undefined && image_url !== '') {
      updateData.image_url = image_url.trim();
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

    await prisma.reviews.deleteMany({ where: { cafe_id: id } });
    await prisma.products.deleteMany({ where: { cafe_id: id } });
    await prisma.cafes.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Cafe deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cafe:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete cafe' }, { status: 500 });
  }
}