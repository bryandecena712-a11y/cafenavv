'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/');
    }
  }, [isMounted, isAuthenticated, user, router]);

  if (!isMounted || !user?.isAdmin) {
    return null; // or a loading spinner
  }

  const tabs = [
    { name: 'Manage Cafes', href: '/admin' },
    { name: 'Audit Log', href: '/admin/audit' },
  ];

  return (
    <div className="flex-1 flex bg-zinc-950 text-white min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-zinc-900/30 flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Admin Panel</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
