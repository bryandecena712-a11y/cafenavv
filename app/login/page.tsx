'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email && password) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          login({
            id: data.user.id,
            name: data.user.username,
            email: data.user.email,
            isAdmin: data.user.email.toLowerCase() === 'admin@admin.com'
          });
          router.push('/');
        } else {
          setError(data.error || 'Login failed');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 sm:p-12 shadow-2xl relative z-10 animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
          <p className="text-zinc-400 text-sm">Sign in to review, chat, and share stories.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Email</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <Link href="#" className="text-xs font-semibold text-amber-500 hover:text-amber-400">Forgot?</Link>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-zinc-950 font-bold py-4 rounded-2xl mt-4 hover:bg-amber-400 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-400">
          Don't have an account?{' '}
          <Link href="/signup" className="text-amber-500 font-semibold hover:text-amber-400 transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
