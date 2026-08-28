import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Fetch all stories
export async function GET() {
  try {
    const stories = await prisma.stories.findMany({
      include: {
        user: { select: { username: true } },
        cafe: { select: { name: true } }
      },
      orderBy: { id: 'desc' }
    });
    
    // Format them for the UI
    const formatted = stories.map(s => ({
      id: s.id,
      user: s.user.username,
      cafe: s.cafe.name,
      image_url: s.image_url,
      time: getTimeAgo(s.created_at!),
      color: 'bg-amber-500' // default UI color
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

// Create a new story
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, cafeId, imageUrl } = data;

    if (!userId || !cafeId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newStory = await prisma.stories.create({
      data: {
        user_id: parseInt(userId),
        cafe_id: parseInt(cafeId),
        image_url: imageUrl
      },
      include: {
        user: { select: { username: true } },
        cafe: { select: { name: true } }
      }
    });
    
    const formatted = {
      id: newStory.id,
      user: newStory.user.username,
      cafe: newStory.cafe.name,
      image_url: newStory.image_url,
      time: 'Just now',
      color: 'bg-amber-500'
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error: any) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}

function getTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  return Math.floor(seconds) + "s";
}
