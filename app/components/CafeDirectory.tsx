'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import EmptyState from './EmptyState';
import { cafeCoordinates } from '@/app/lib/coordinates';

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

// Haversine formula to calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default function CafeDirectory({ initialCafes }: CafeDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [vibeFilter, setVibeFilter] = useState('');

  const [sortByNearest, setSortByNearest] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const toggleNearest = () => {
    if (!sortByNearest) {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
          setSortByNearest(true);
          setLocationError('');
        },
        (error) => {
          setIsLocating(false);
          setLocationError('Unable to retrieve your location');
          console.error(error);
        }
      );
    } else {
      setSortByNearest(false);
    }
  };

  const filteredAndSortedCafes = useMemo(() => {
    // 1. Filter
    let result = initialCafes.filter((cafe) => {
      const matchesSearch =
        cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cafe.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = priceFilter ? cafe.price_level === priceFilter : true;
      const matchesVibe = vibeFilter ? cafe.vibe === vibeFilter : true;

      return matchesSearch && matchesPrice && matchesVibe;
    });

    // 2. Map coordinates if needed for distance
    if (sortByNearest && userLocation) {
      result = result
        .map((cafe) => {
          let lat, lng;
          if (cafe.location && cafe.location.includes(',')) {
            [lat, lng] = cafe.location.split(',').map(parseFloat);
          } else if (cafeCoordinates[cafe.name]) {
            lat = cafeCoordinates[cafe.name].lat;
            lng = cafeCoordinates[cafe.name].lng;
          }

          if (lat !== undefined && lng !== undefined) {
            const distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, lat, lng);
            return { ...cafe, distance };
          }
          return { ...cafe, distance: Infinity };
        })
        .sort((a, b) => a.distance - b.distance);
    }

    return result;
  }, [initialCafes, searchQuery, priceFilter, vibeFilter, sortByNearest, userLocation]);

  return (
    <>
      <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-50 mb-4">Popular Spots</h2>
          <p className="text-zinc-400 text-lg leading-relaxed text-balance">
            Navigate straight to the brews everyone is talking about. Hand-picked spots for studying, catching up, or just zoning out.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search cafes or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 transition-colors flex-1 sm:w-64"
          />
          <div className="flex gap-3">
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 transition-colors flex-1"
            >
              <option value="">Any Price</option>
              <option value="₱">₱ (Affordable)</option>
              <option value="₱₱">₱₱ (Moderate)</option>
              <option value="₱₱₱">₱₱₱ (Premium)</option>
            </select>
            <button
              onClick={toggleNearest}
              className={`px-4 py-3 rounded-xl flex items-center justify-center gap-2 border transition-all font-medium whitespace-nowrap ${
                sortByNearest
                  ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-amber-500/50'
              }`}
            >
              {isLocating ? (
                <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin inline-block"></span>
              ) : (
                <>
                  <span>📍</span> {sortByNearest ? 'Nearest First' : 'Find Nearest'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {locationError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {locationError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {filteredAndSortedCafes.length === 0 && <EmptyState />}

        {filteredAndSortedCafes.map((cafe) => (
          <div
            key={cafe.id}
            className="group relative flex flex-col bg-zinc-900/30 backdrop-blur-md rounded-[24px] overflow-hidden border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-500"
          >
            <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden">
              <Image
                src={cafe.image_url || '/images/brewco.jpg'}
                alt={cafe.name || 'Cafe'}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-90" />

              <div className="absolute top-5 left-5 flex gap-2 flex-wrap max-w-[80%]">
                <span className="bg-zinc-950/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium tracking-wide text-zinc-300 border border-white/5 truncate">
                  {cafe.location}
                </span>
                {cafe.distance !== undefined && cafe.distance !== Infinity && (
                  <span className="bg-amber-500 text-zinc-950 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg">
                    {cafe.distance.toFixed(1)} km
                  </span>
                )}
              </div>
            </div>

            <div className="p-8 flex flex-col flex-1 relative z-10 -mt-10">
              <h3 className="text-2xl font-semibold text-zinc-100 mb-2">{cafe.name}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8 flex-1 line-clamp-3">
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
        <CafeMap cafes={filteredAndSortedCafes} />
      </div>
    </>
  );
}