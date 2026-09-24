import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Force dynamic execution & disable caching so Next.js never pre-renders this route at build time
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const logs = await prisma.audit_logs.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return NextResponse.json(logs, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    
    // Return empty array with 200 status code during build step fallback if DB is unreachable
    return NextResponse.json([], { status: 200 });
  }
}