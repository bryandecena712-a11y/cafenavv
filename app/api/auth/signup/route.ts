import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    const newUser = await prisma.users.create({
      data: {
        username,
        email,
        password, // In a real app, hash this password!
      },
    });

    return NextResponse.json({
      message: 'User registered successfully!',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        isAdmin: newUser.role === 'ADMIN'
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create user account.' }, { status: 500 });
  }
}

