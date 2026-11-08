'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send a verification code.');
      setCodeSent(true);
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send a verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not reset your password.');
      setMessage(data.message);
      setCodeSent(false);
      setCode('');
      setPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-white">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-zinc-900/60 p-8 shadow-2xl sm:p-12">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            {codeSent ? 'Set a New Password' : 'Forgot Password?'}
          </h1>
          <p className="text-sm text-zinc-400">
            {codeSent
              ? `Enter the six-digit code sent to ${email}, then choose a new password.`
              : 'We’ll email you a one-time code to reset your password.'}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm text-emerald-400">
            {message}
          </div>
        )}

        {!codeSent ? (
          <form onSubmit={handleRequestCode} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="ml-1 text-sm font-medium text-zinc-300">Gmail address</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/50 px-5 py-4 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-amber-500 py-4 font-bold text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="reset-code" className="ml-1 text-sm font-medium text-zinc-300">Six-digit code</label>
              <input
                id="reset-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/50 px-5 py-4 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="new-password" className="ml-1 text-sm font-medium text-zinc-300">New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/50 px-5 py-4 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="ml-1 text-sm font-medium text-zinc-300">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter your new password again"
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/50 px-5 py-4 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-amber-500 py-4 font-bold text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Change Password'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setCodeSent(false);
                setCode('');
                setMessage('');
                setError('');
              }}
              className="w-full text-sm font-semibold text-amber-500 hover:text-amber-400"
            >
              Use a different email or request a new code
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-zinc-400">
          Remembered your password?{' '}
          <Link href="/login" className="font-semibold text-amber-500 hover:text-amber-400">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
