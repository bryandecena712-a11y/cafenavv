'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-50">
          CafeNav
        </Link>
        
        <div className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/offers" className="text-zinc-300 hover:text-white transition-colors">
            Match Quiz
          </Link>
          
          {isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-white hover:border-amber-500 transition-colors"
              >
                {user?.name?.charAt(0) || 'U'}
              </button>
              
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute right-0 mt-3 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        {user?.name}
                        {user?.isAdmin && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] uppercase font-bold rounded-md">Admin</span>}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-2 border-b border-white/5">
                      {user?.isAdmin && (
                        <Link 
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <Link 
                        href="#"
                        className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                      >
                        Profile Settings
                      </Link>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => { logout(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/login" className="text-zinc-300 hover:text-white transition-colors px-3 py-2">
                Log In
              </Link>
              <Link href="/signup" className="bg-amber-500 text-zinc-950 px-5 py-2.5 rounded-full hover:bg-amber-400 hover:scale-[0.98] transition-all font-semibold shadow-lg shadow-amber-500/20">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
