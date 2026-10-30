'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AdminSidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pending';

  // Determine active state per specific route/tab
  const isPendingActive = pathname === '/admin' && currentTab === 'pending';
  const isManageActive = pathname === '/admin' && currentTab === 'manage';
  const isDiscoveredActive = pathname === '/admin' && currentTab === 'discovered';
  const isAuditActive = pathname.startsWith('/admin/audit');

  return (
    <aside className="w-full md:w-64 border-b md:border-r border-white/5 bg-zinc-950 p-6 flex flex-col gap-6 shrink-0 md:min-h-screen">
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          ADMIN PANEL
        </h2>
        <nav className="flex flex-col sm:flex-row md:flex-col gap-1.5 overflow-x-auto scrollbar-hide">
          {/* 1. Pending Approvals */}
          <Link
            href="/admin?tab=pending"
            className={`whitespace-nowrap px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3 ${
              isPendingActive
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Pending Approvals</span>
          </Link>

          {/* 2. Manage Cafes */}
          <Link
            href="/admin?tab=manage"
            className={`whitespace-nowrap px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3 ${
              isManageActive
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            <span>Manage Cafes</span>
          </Link>

          {/* 3. Discovered */}
          <Link
            href="/admin?tab=discovered"
            className={`whitespace-nowrap px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3 ${
              isDiscoveredActive
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            <span>Discovered</span>
          </Link>

          {/* 4. Audit Log */}
          <Link
            href="/admin/audit"
            className={`whitespace-nowrap px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3 ${
              isAuditActive
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Audit Log</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-white">
      {/* Sidebar wrapped in Suspense boundary for searchParams */}
      <Suspense fallback={<div className="w-full md:w-64 bg-zinc-950 border-b md:border-r border-white/5 p-6" />}>
        <AdminSidebarContent />
      </Suspense>

      {/* Main Content View */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}