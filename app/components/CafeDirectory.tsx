'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import EmptyState from './EmptyState';
import { loadCachedCafes, loadDirectoryPreferences, saveCachedCafes, saveDirectoryPreferences } from '@/app/lib/offlineStorage';

// Dynamically import Leaflet map component with SSR disabled
const CafeMap = dynamic(() => import('./CafeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-zinc-900/50 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-800">
      Loading interactive map...
    </div>
  ),
});

interface CafeDirectoryProps {
  initialCafes: any[];
}

// Helper function to check if location string contains raw numeric coordinates
function isRawCoordinates(locationStr?: string): boolean {
  if (!locationStr) return false;
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(locationStr.trim());
}

export default function CafeDirectory({ initialCafes }: CafeDirectoryProps) {
  const preferences = loadDirectoryPreferences();
  const [cafes, setCafes] = useState<any[]>(initialCafes);
  const [searchQuery, setSearchQuery] = useState(preferences?.searchQuery || '');

  useEffect(() => {
    saveCachedCafes(initialCafes);
    setCafes(initialCafes);
    loadCachedCafes<any>().then((cached) => {
      if (cached?.length && !navigator.onLine) setCafes(cached);
    });
  }, [initialCafes]);

  useEffect(() => {
    saveDirectoryPreferences({ 
      searchQuery, 
      priceFilter: '', 
      vibeFilter: '' 
    });
  }, [searchQuery]);

  const filteredCafes = useMemo(() => {
    return cafes.filter((cafe) => {
      const name = cafe.name?.toLowerCase() || '';
      const location = cafe.location?.toLowerCase() || '';
      return name.includes(searchQuery.toLowerCase()) || location.includes(searchQuery.toLowerCase());
    });
  }, [cafes, searchQuery]);

  return (
    <>
      <div className="mb-12 sm:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
        <div className="max-w-xl">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-50 mb-4">Popular Spots</h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed text-balance">
            Navigate straight to the brews everyone is talking about. Hand-picked spots for studying, catching up, or just zoning out.
          </p>
        </div>

        {/* Highly Visible Search Bar */}
        <div className="w-full md:w-96 relative flex items-center">
          <div className="relative w-full flex items-center bg-zinc-900 border border-zinc-700/80 rounded-2xl focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30 transition-all shadow-xl overflow-hidden">
            <input
              type="text"
              placeholder="Search cafes or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white px-5 py-3.5 text-sm placeholder-zinc-400 focus:outline-none"
            />
            <button
              type="button"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-3.5 flex items-center justify-center gap-1.5 transition-colors border-l border-amber-400/50 cursor-pointer text-sm shrink-0"
              title="Search"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {filteredCafes.length === 0 && <EmptyState />}

        {filteredCafes.map((cafe) => (
          <div
            key={cafe.id}
            className="group relative flex flex-col bg-zinc-900/30 backdrop-blur-md rounded-2xl sm:rounded-[24px] overflow-hidden border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-500"
          >
            <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden">
              <Image
                src={cafe.image_url || '/images/brewco.jpg'}
                alt={cafe.name || 'Cafe'}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-90" />

              {/* Only show location badge if it is NOT raw coordinates */}
              {cafe.location && !isRawCoordinates(cafe.location) && (
                <div className="absolute top-5 left-5 flex gap-2 flex-wrap max-w-[80%]">
                  <span className="bg-zinc-950/75 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium tracking-wide text-zinc-200 border border-white/10 truncate">
                    📍 {cafe.location}
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-8 flex flex-col flex-1 relative z-10 -mt-10">
              <h3 className="text-xl sm:text-2xl font-semibold text-zinc-100 mb-2">{cafe.name}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6 sm:mb-8 flex-1 line-clamp-3">
                {cafe.description}
              </p>

              <Link
                href={`/cafe/${cafe.id}`}
                className="w-full bg-zinc-800/80 text-zinc-200 font-medium py-3.5 rounded-xl border border-zinc-700/50 hover:bg-amber-500 hover:text-zinc-950 hover:border-amber-500 active:scale-[0.98] transition-all text-center block"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-10 w-full">
        <CafeMap cafes={filteredCafes} />
      </div>
    </>
  );
}