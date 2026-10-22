'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Poll for real-time notifications ONLY for regular users (not Admins)
  useEffect(() => {
    if (!user?.id || user?.isAdmin) return;

    const checkNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to poll notifications:', err);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 4000);
    return () => clearInterval(interval);
  }, [user?.id, user?.isAdmin]);

  const handleMarkAsRead = async () => {
    if (!user?.id || user?.isAdmin) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-zinc-950/90 backdrop-blur-md border-b border-white/5 min-h-16 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <Image
            src="/logo-cafenav.png"
            alt="CafeNav Logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-zinc-50 group-hover:text-amber-500 transition-colors">
            CafeNav
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-6 text-sm font-medium">
          {isAuthenticated ? (
            <div className="relative flex items-center gap-2">
              {/* User Avatar Circle */}
              <div className="relative">
                <button
                  aria-label="Open account menu"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-white hover:border-amber-500 transition-colors relative cursor-pointer"
                >
                  {user?.name?.charAt(0) || 'U'}

                  {/* Red Dot Notification Badge (Regular Users Only) */}
                  {!user?.isAdmin && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-zinc-950 rounded-full animate-pulse" />
                  )}
                </button>

                {/* Dropdown Arrow Indicator */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-800 border border-zinc-600 rounded-full flex items-center justify-center text-[8px] text-zinc-300 cursor-pointer"
                >
                  ▼
                </button>
              </div>
              
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute right-0 top-12 w-52 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white flex items-center justify-between">
                        <span className="truncate">{user?.name}</span>
                        {user?.isAdmin && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] uppercase font-bold rounded-md shrink-0">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>

                    <div className="p-2 border-b border-white/5">
                      {user?.isAdmin ? (
                        <Link 
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      ) : (
                        <>
                          <Link 
                            href="/profile"
                            onClick={() => {
                              setIsDropdownOpen(false);
                              handleMarkAsRead();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between"
                          >
                            <span>My Profile</span>
                          </Link>

                          <Link 
                            href="/notifications"
                            onClick={() => {
                              setIsDropdownOpen(false);
                              handleMarkAsRead();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors flex items-center justify-between"
                          >
                            <span>🔔 Notifications</span>
                            {unreadCount > 0 && (
                              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="p-2">
                      <button 
                        onClick={() => { logout(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-3">
              <Link href="/login" className="text-zinc-300 hover:text-white transition-colors px-2 sm:px-3 py-2">
                Log In
              </Link>
              <Link href="/signup" className="bg-amber-500 text-zinc-950 px-3 sm:px-5 py-2.5 rounded-full hover:bg-amber-400 hover:scale-[0.98] transition-all font-semibold shadow-lg shadow-amber-500/20">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}