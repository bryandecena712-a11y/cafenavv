import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

// Force dynamic runtime execution to prevent Vercel build prerender crashes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Find user by normalized email
    const user = await prisma.users.findFirst({
      where: { email: cleanEmail },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 400 }
      );
    }

    // Compare plain-text password against bcrypt hashed password stored in DB
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Fallback support in case old admin account was created with plain text
    const isPlainTextMatch = user.password === password;

    if (!isPasswordValid && !isPlainTextMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 400 }
      );
    }

    // Log login activity in audit logs
    try {
      await prisma.audit_logs.create({
        data: {
          user_id: user.id,
          action: user.role === 'ADMIN' ? 'Admin Login' : 'User Login',
          target: 'System',
        },
      });
    } catch (auditError) {
      console.warn('Failed to record audit log:', auditError);
    }

    return NextResponse.json(
      {
        message: 'Login successful!',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.role === 'ADMIN',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Database query failed: ' + error.message },
      { status: 500 }
    );
  }
}