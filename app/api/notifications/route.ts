import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const notifications = await prisma.notifications.findMany({
      where: { user_id: Number(userId) },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: error.message || 'Error fetching notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.notifications.updateMany({
      where: { user_id: Number(userId), is_read: false },
      data: { is_read: true },
    });

    return NextResponse.json({ message: 'Notifications marked as read' });
  } catch (error: any) {
    console.error('Failed to update notifications:', error);
    return NextResponse.json({ error: error.message || 'Error updating notifications' }, { status: 500 });
  }
}