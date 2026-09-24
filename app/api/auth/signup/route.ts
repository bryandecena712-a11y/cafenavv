import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, email, password } = body;

    // Support both 'username' and 'name' sent from front-end form
    const userDisplayName = (username || name || '').trim();
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!userDisplayName || !cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Name/Username, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check for existing user
    const existingUser = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // Securely hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in Prisma
    const newUser = await prisma.users.create({
      data: {
        username: userDisplayName,
        email: cleanEmail,
        password: hashedPassword,
        role: 'USER',
      },
    });

    return NextResponse.json(
      {
        message: 'User registered successfully!',
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          isAdmin: newUser.role === 'ADMIN',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);

    // Return exact Prisma database or field errors for easy debugging
    return NextResponse.json(
      { error: error?.message || 'Failed to create user account.' },
      { status: 500 }
    );
  }
}