import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Forces Next.js to skip static build-time generation
export const dynamic = 'force-dynamic';

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
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}