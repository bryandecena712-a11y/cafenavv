'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CafeDetailsClientProps {
  cafe: any;
}

// Mock Menu Data with heart counts
const MOCK_MENU = [
  { id: 1, name: 'Flat White', category: 'Coffee', price: 150, popularity: 98, hearts: 342 },
  { id: 2, name: 'Matcha Latte', category: 'Tea', price: 180, popularity: 95, hearts: 289 },
  { id: 3, name: 'Iced Americano', category: 'Coffee', price: 130, popularity: 92, hearts: 256 },
  { id: 4, name: 'Almond Croissant', category: 'Pastry', price: 120, popularity: 88, hearts: 198 },
  { id: 5, name: 'Pour Over', category: 'Coffee', price: 200, popularity: 85, hearts: 145 },
  { id: 6, name: 'Espresso Tonic', category: 'Coffee', price: 160, popularity: 75, hearts: 89 },
];

export default function CafeDetailsClient({ cafe }: CafeDetailsClientProps) {
  const [sortMethod, setSortMethod] = useState<'popularity' | 'price'>('popularity');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sortedMenu = [...MOCK_MENU].sort((a, b) => {
    if (sortMethod === 'popularity') return b.popularity - a.popularity;
    return a.price - b.price;
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 pb-24">
      {/* Back Button Overlay */}
      <div className="fixed top-6 left-6 z-50">
        <Link 
          href="/"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 text-white/90 hover:text-white hover:bg-zinc-800/80 hover:scale-105 active:scale-95 transition-all shadow-2xl"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-[400px] md:h-[500px]">
        <Image 
          src={cafe.image_url || '/images/brewco.jpg'} 
          alt={cafe.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 max-w-5xl mx-auto px-6">
          <div className="text-sm font-bold tracking-widest text-amber-500 uppercase mb-3">
            {cafe.location}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
            {cafe.name}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12">
        <div className="grid md:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Main Content (Left) */}
          <div className="md:col-span-7 lg:col-span-8 space-y-16">
            
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold mb-5 text-white tracking-tight">About</h2>
              <p className="text-lg leading-relaxed text-zinc-300">
                {cafe.description || "A cozy spot for your daily grind. Enjoy expertly crafted coffee in a warm, inviting atmosphere perfect for getting work done or catching up with friends."}
              </p>
            </section>

            {/* Menu */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">Menu</h2>
                
                {/* Segmented Control */}
                <div className="flex items-center bg-zinc-900/80 backdrop-blur-md rounded-full p-1 border border-white/5">
                  <button 
                    onClick={() => setSortMethod('popularity')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${sortMethod === 'popularity' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Popular
                  </button>
                  <button 
                    onClick={() => setSortMethod('price')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${sortMethod === 'price' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Price
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {sortedMenu.map((item) => (
                  <div key={item.id} className="group flex items-center justify-between p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
                        <span className="text-2xl">{item.category === 'Coffee' ? '☕' : item.category === 'Tea' ? '🍵' : '🥐'}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-100 text-lg">{item.name}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-amber-500 font-bold">₱{item.price}</span>
                          <span className="text-sm text-zinc-500 font-medium flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full">
                            {item.hearts + (favorites.has(item.id) ? 1 : 0)} 
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={favorites.has(item.id) ? "#f43f5e" : "currentColor"} className={favorites.has(item.id) ? "text-rose-500" : "text-zinc-600"} stroke="none">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => toggleFavorite(item.id)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${favorites.has(item.id) ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border-white/5'} border`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={favorites.has(item.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar (Right) - Ratings */}
          <div className="md:col-span-5 lg:col-span-4">
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold mb-8 text-white tracking-tight">Ratings & Reviews</h2>
              
              {/* App Store Style Rating Block */}
              <div className="flex items-center gap-6 mb-8">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[5rem] font-bold tracking-tighter text-white leading-none">4.8</span>
                  <span className="text-[11px] font-bold text-zinc-500 mt-2 uppercase tracking-[0.2em]">Out of 5</span>
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5 pt-2">
                  {/* 5 Star Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex text-zinc-400 text-[9px] tracking-[-1px] w-12 justify-end">★★★★★</div>
                    <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-300 w-[85%] rounded-full"></div>
                    </div>
                  </div>
                  {/* 4 Star Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex text-zinc-400 text-[9px] tracking-[-1px] w-12 justify-end">★★★★</div>
                    <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-300 w-[10%] rounded-full"></div>
                    </div>
                  </div>
                  {/* 3 Star Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex text-zinc-400 text-[9px] tracking-[-1px] w-12 justify-end">★★★</div>
                    <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-300 w-[3%] rounded-full"></div>
                    </div>
                  </div>
                  {/* 2 Star Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex text-zinc-400 text-[9px] tracking-[-1px] w-12 justify-end">★★</div>
                    <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-300 w-[1%] rounded-full"></div>
                    </div>
                  </div>
                  {/* 1 Star Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex text-zinc-400 text-[9px] tracking-[-1px] w-12 justify-end">★</div>
                    <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-300 w-[1%] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-zinc-400 mb-8 pb-8 border-b border-white/5">
                <span>124 Ratings</span>
                <Link href="#" className="text-amber-500 font-semibold hover:text-amber-400">See All</Link>
              </div>

              {/* Sample Review */}
              <div className="bg-white/[0.02] rounded-[24px] p-6 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-white text-base tracking-tight">Amazing atmosphere</div>
                  <div className="text-zinc-500 text-sm font-medium">Oct 12</div>
                </div>
                <div className="flex text-amber-500 text-sm mb-4 tracking-tight">★★★★★</div>
                <p className="text-[15px] text-zinc-300 leading-relaxed">
                  "This has become my go-to spot for working. The wifi is fast, the coffee is top tier, and the staff are always friendly. Highly recommend the flat white!"
                </p>
                <div className="mt-5 text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">A</div>
                  Alex D.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
