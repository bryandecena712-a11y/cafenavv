'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (name && email && password) {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Log the user in on successful signup
          login({
            id: data.userId,
            name: name,
            email: email,
            isAdmin: email.toLowerCase() === 'admin@admin.com'
          });
          router.push('/');
        } else {
          setError(data.error || 'Signup failed');
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
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Join CafeNav</h1>
          <p className="text-zinc-400 text-sm">Create an account to join the community.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Coffee"
              className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-5 py-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-zinc-950 font-bold py-4 rounded-2xl mt-4 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-500 font-semibold hover:text-amber-400 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
