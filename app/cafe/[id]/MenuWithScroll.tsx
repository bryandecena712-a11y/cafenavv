'use client';

import { useState, useRef, useEffect } from 'react';
import { CaretLeft, CaretRight, Coffee, TeaBag, Cookie, Notepad } from '@phosphor-icons/react';

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  image_url?: string | null;
}

interface MenuWithScrollProps {
  products: Product[];
}

export default function MenuWithScroll({ products }: MenuWithScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollRef.current;
    if (!container) return;
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 bg-zinc-900/50 border border-white/5 rounded-3xl flex flex-col items-center">
        <i className="ph-duotone ph-notepad text-zinc-600 text-5xl mb-4"></i>
        <h3 className="text-xl font-medium text-white mb-2">No menu available</h3>
        <p className="text-zinc-500">This cafe hasn't added any products to their menu yet.</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-zinc-950/90 backdrop-blur border border-white/10 flex items-center justify-center text-white/70 hover:text-amber-400 hover:border-amber-500/50 transition-all shadow-lg ${
          !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
        }`}
        aria-label="Scroll menu left"
      >
        <CaretLeft weight="bold" className="w-6 h-6" />
      </button>

      {/* Scrollable Menu Row */}
      <div
        ref={scrollRef}
        onScroll={updateScrollButtons}
        className="overflow-x-auto scrollbar-hide py-4 px-2"
      >
        <div className="flex flex-nowrap gap-6">
          {products.map((product: any) => (
            <div
              key={product.id}
              className="w-[280px] sm:w-[320px] shrink-0 bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-colors flex flex-col group shadow-lg"
            >
              <div className="w-full h-48 bg-zinc-800 relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Coffee size={40} weight="duotone" className="text-amber-500" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-zinc-950/90 backdrop-blur text-amber-400 font-bold px-3 py-1.5 rounded-full text-sm border border-amber-500/20 shadow-md">
                  ₱{product.price}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-white mb-2">{product.name}</h3>
                <p className="text-zinc-400 text-sm flex-1 leading-relaxed">
                  {product.description
                    ? product.description.replace(/\[ENV:.*?\]/g, '').replace(/\[USER:.*?\]/g, '').trim()
                    : 'No description provided.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-zinc-950/90 backdrop-blur border border-white/10 flex items-center justify-center text-white/70 hover:text-amber-400 hover:border-amber-500/50 transition-all shadow-lg ${
          !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
        }`}
        aria-label="Scroll menu right"
      >
        <CaretRight weight="bold" className="w-6 h-6" />
      </button>
    </div>
  );
}