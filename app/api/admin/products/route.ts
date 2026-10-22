import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Forza l'esecuzione dinamica a runtime per evitare errori durante la build su Vercel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fetch Pending Menu Suggestions for Admin
export async function GET() {
  try {
    const pendingProducts = await prisma.products.findMany({
      where: { status: 'PENDING' },
      include: { cafe: true },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(pendingProducts, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending products:', error);
    return NextResponse.json({ error: 'Failed to fetch pending products' }, { status: 500 });
  }
}

// POST: Create a new product (attaches user_id tag in description if present)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { user_id, userId, cafeId, name, price, description, image_url } = data;

    if (!cafeId || !name || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const submitterId = user_id || userId;
    const cleanDesc = description?.trim() || 'No description provided';
    const finalDescription = `${cleanDesc}${submitterId ? ` [USER:${submitterId}]` : ''}`;

    const product = await prisma.products.create({
      data: {
        cafe_id: parseInt(cafeId, 10),
        name: name.trim(),
        price: String(price),
        description: finalDescription,
        image_url: image_url || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT: Update an existing product (Triggers approval notification if status becomes APPROVED)
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name, price, description, image_url, status } = data;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const productId = parseInt(id, 10);

    // Retrieve existing product to read submitter user tag
    const existingProduct = await prisma.products.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updatedProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        ...(name && { name: name.trim() }),
        ...(price && { price: String(price) }),
        ...(description !== undefined && { description }),
        ...(image_url !== undefined && { image_url }),
        ...(status && { status }),
      },
    });

    // Send real-time approval notification if status was changed to APPROVED
    if (status === 'APPROVED') {
      let targetUserId: number | null = null;
      if (existingProduct.description && existingProduct.description.includes('[USER:')) {
        const match = existingProduct.description.match(/\[USER:(\d+)\]/);
        if (match && match[1]) {
          targetUserId = Number(match[1]);
        }
      }

      if (targetUserId) {
        await (prisma as any).notifications.create({
          data: {
            user_id: targetUserId,
            title: 'Menu Item Suggestion Approved! 🎉',
            message: `Your suggested menu item "${existingProduct.name}" has been approved by the admin and is now published live!`,
            type: 'APPROVAL',
            is_read: false,
          },
        });
      }
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE: Delete a product by ID (Triggers rejection notification with admin reason)
export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id, reason } = data;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const productId = parseInt(id, 10);
    const rejectionReason = reason?.trim() || 'It could not be published at this time.';

    const existingProduct = await prisma.products.findUnique({
      where: { id: productId },
    });

    if (existingProduct) {
      let targetUserId: number | null = null;
      if (existingProduct.description && existingProduct.description.includes('[USER:')) {
        const match = existingProduct.description.match(/\[USER:(\d+)\]/);
        if (match && match[1]) {
          targetUserId = Number(match[1]);
        }
      }

      if (targetUserId) {
        await (prisma as any).notifications.create({
          data: {
            user_id: targetUserId,
            title: 'Menu Item Suggestion Update',
            message: `Your suggested menu item "${existingProduct.name}" was reviewed and could not be published: ${rejectionReason}`,
            type: 'REJECTION',
            is_read: false,
          },
        });
      }

      await prisma.products.delete({
        where: { id: productId },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}