import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Force dynamic execution & disable caching so Next.js never pre-renders this route at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
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

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    
    // Return empty array with 200 during build step fallback if DB is unreachable
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    );
  }
}