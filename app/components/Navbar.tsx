'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-50">
          CafeNav
        </Link>
        
        <div className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/offers" className="bg-amber-500 text-zinc-950 px-5 py-2 rounded-full hover:bg-amber-400 hover:scale-[0.98] transition-all">
            Match Quiz
          </Link>
        </div>
      </div>
    </nav>
  );
}
