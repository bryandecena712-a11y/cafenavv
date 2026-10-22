'use client';

import { useState, useEffect } from 'react';
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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <p className="text-zinc-400 mb-4">Please log in to view your notifications.</p>
        <Link href="/login" className="bg-amber-500 text-zinc-950 px-6 py-2 rounded-full font-bold">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            <p className="text-zinc-400 text-sm mt-1">Real-time status updates for your suggestions.</p>
          </div>
          <Link href="/" className="text-xs bg-zinc-900 border border-white/10 px-4 py-2 rounded-full text-zinc-300 hover:text-white">
            ← Back to Home
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12 text-center text-zinc-500">
            🔔 No notifications right now!
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
                      {n.type === 'APPROVAL' && '✅'}
                      {n.type === 'REJECTION' && '❌'}
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