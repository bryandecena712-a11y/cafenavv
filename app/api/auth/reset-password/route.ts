import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_CODE_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Enter the email address and six-digit code from your email.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Your new password must be at least 8 characters.' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'The code is invalid or expired. Request a new code and try again.' }, { status: 400 });
    }

    const reset = await prisma.password_reset_otps.findUnique({
      where: { user_id: user.id },
    });
    const now = new Date();
    if (!reset || reset.used_at || reset.expires_at <= now) {
      return NextResponse.json({ error: 'The code is invalid or expired. Request a new code and try again.' }, { status: 400 });
    }
    if (reset.attempts >= MAX_CODE_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many incorrect codes. Request a new code to continue.' }, { status: 429 });
    }

    const codeMatches = await bcrypt.compare(code, reset.code_hash);
    if (!codeMatches) {
      await prisma.password_reset_otps.updateMany({
        where: {
          id: reset.id,
          attempts: reset.attempts,
          used_at: null,
          expires_at: { gt: now },
        },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: 'The code is incorrect or expired. Check it and try again.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await prisma.$transaction(async (transaction) => {
      const claim = await transaction.password_reset_otps.updateMany({
        where: {
          id: reset.id,
          user_id: user.id,
          code_hash: reset.code_hash,
          attempts: reset.attempts,
          used_at: null,
          expires_at: { gt: new Date() },
        },
        data: { used_at: new Date() },
      });
      if (claim.count !== 1) return false;

      await transaction.users.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      return true;
    });

    if (!updated) {
      return NextResponse.json({ error: 'The code is invalid, expired, or already used. Request a new code.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Your password has been changed. You can now sign in.' });
  } catch (error) {
    console.error('Password reset failed:', error);
    return NextResponse.json({ error: 'Could not reset your password. Please try again later.' }, { status: 500 });
  }
}
