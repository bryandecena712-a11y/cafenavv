'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* SINGLE ADMIN PANEL SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-zinc-950 p-6 flex flex-col gap-6 shrink-0 min-h-screen">
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            ADMIN PANEL
          </h2>
          <nav className="flex flex-col gap-1.5">
            {/* 1. Pending Approvals */}
            <Link
              href="/admin?tab=pending"
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                pathname === '/admin' && (!pathname.includes('tab') || pathname.includes('pending'))
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Pending Approvals
            </Link>

            {/* 2. Manage Cafes */}
            <Link
              href="/admin?tab=manage"
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                pathname === '/admin' && pathname.includes('tab=manage')
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Manage Cafes
            </Link>

            {/* 3. Discovered */}
            <Link
              href="/admin?tab=discovered"
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                pathname === '/admin' && pathname.includes('tab=discovered')
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Discovered
            </Link>

            {/* 4. Audit Logs */}
            <Link
              href="/admin/audit"
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                pathname.startsWith('/admin/audit')
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Audit Log
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}