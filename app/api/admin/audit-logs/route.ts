import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.audit_logs.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            username: true,
          }
        }
      }
    });
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
