import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    const queryOptions: any = {
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    };

    if (limit !== 'all') {
      queryOptions.take = 5;
    }

    const logs = await prisma.audit_logs.findMany(queryOptions);

    return NextResponse.json(logs, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json([], { status: 200 });
  }
}