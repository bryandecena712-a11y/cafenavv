import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { isGmailConfigured, sendPasswordResetCode } from '@/app/lib/gmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GENERIC_RESPONSE = {
  message: 'If an account exists for that email, a verification code has been sent.',
};
const RESEND_COOLDOWN_MS = 60 * 1000;
const CODE_LIFETIME_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    if (!isGmailConfigured()) {
      console.error('Password reset email is unavailable: Gmail SMTP environment variables are not configured.');
      return NextResponse.json(
        { error: 'Password reset email is not configured yet. Please contact the site administrator.' },
        { status: 503 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return NextResponse.json(GENERIC_RESPONSE);

    const now = new Date();
    const existing = await prisma.password_reset_otps.findUnique({
      where: { user_id: user.id },
      select: { last_sent_at: true },
    });
    if (existing && now.getTime() - existing.last_sent_at.getTime() < RESEND_COOLDOWN_MS) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const code = String(randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);
    await prisma.password_reset_otps.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        code_hash: codeHash,
        expires_at: new Date(now.getTime() + CODE_LIFETIME_MS),
        attempts: 0,
        created_at: now,
        last_sent_at: now,
        used_at: null,
      },
      update: {
        code_hash: codeHash,
        expires_at: new Date(now.getTime() + CODE_LIFETIME_MS),
        attempts: 0,
        created_at: now,
        last_sent_at: now,
        used_at: null,
      },
    });

    try {
      await sendPasswordResetCode(email, code);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      await prisma.password_reset_otps.deleteMany({
        where: { user_id: user.id, code_hash: codeHash },
      });
      return NextResponse.json(
        { error: 'Could not deliver the verification email. Check the Gmail setup and try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('Password reset request failed:', error);
    return NextResponse.json({ error: 'Could not request a password reset. Please try again later.' }, { status: 500 });
  }
}
