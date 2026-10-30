'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
  }, [user?.id]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white relative">
        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-full text-sm hover:bg-amber-400 transition-colors shadow-md"
          >
            ← Back to Home
          </Link>
        </div>

        <p className="text-zinc-400 mb-4">Please log in to view your notifications.</p>
        <Link href="/login" className="bg-amber-500 text-zinc-950 px-6 py-2 rounded-full font-bold">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-12 px-6 relative">
      {/* Top Left "Back to Home" Amber Pill Button matching /suggest */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-full text-sm hover:bg-amber-400 transition-colors shadow-md"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-zinc-400 text-sm">Real-time status updates for your suggestions.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center">
            <i className="ph-duotone ph-bell text-5xl mb-4 text-zinc-700"></i>
            No notifications right now!
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition-all ${
                  n.type === 'APPROVAL'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : n.type === 'REJECTION'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-zinc-900 border-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      {n.type === 'APPROVAL' && <CheckCircle size={16} weight="bold" className="text-emerald-500" />}
                      {n.type === 'REJECTION' && <Circle size={16} weight="bold" className="text-rose-500" />}
                      {n.title}
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}