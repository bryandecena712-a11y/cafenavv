import { NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

export async function GET() {
  try {
    const client = createClient({ url: 'file:cafenav.db' });
    const adapter = new PrismaLibSql(client);
    const prisma = new PrismaClient({ adapter });

    const cafes = await prisma.cafes.findMany({
      orderBy: { id: 'desc' }
    });
    
    return NextResponse.json(cafes);
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 });
  }
}
