import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

// Force dynamic execution & prevent static prerender build crashes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, name, email, password } = body;

    const cleanEmail = (email || '').toLowerCase().trim();
    const displayName = (username || name || '').trim();

    if (!cleanEmail || !password || !displayName) {
      return NextResponse.json(
        { error: 'Please fill out all required fields.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: displayName }
        ]
      },
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'This username is already taken. Please choose another.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user record safely
    const newUser = await prisma.users.create({
      data: {
        username: displayName,
        email: cleanEmail,
        password: hashedPassword,
        role: 'USER',
      },
    });

    return NextResponse.json(
      { success: true, userId: newUser.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle duplicate key database constraints
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email or username already exists.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Server error during registration. Please try again.' },
      { status: 500 }
    );
  }
}