'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import Link from 'next/link';

import { cafeCoordinates, defaultCenter } from '@/app/lib/coordinates';

interface CafeMapProps {
  cafes: any[];
}

// Ultra-minimal dark raster tile style (no API keys required)
const mapcnDarkStyle = {
  version: 8 as const,
  sources: {
    'dark-tiles': {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: 'dark-tiles-layer',
      type: 'raster' as const,
      source: 'dark-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export default function CafeMap({ cafes }: CafeMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<{ cafe: any; coords: { lat: number; lng: number } } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.warn('Geolocation warning:', error),
        { timeout: 8000 }
      );
    }
  }, []);

  const center = userLocation || defaultCenter;

  return (
    <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-zinc-800/80 shadow-2xl relative bg-black">
      {/* Target the Map Canvas specifically for pitch-black contrast */}
      <div className="w-full h-full [&_.maplibregl-canvas]:brightness-[0.7] [&_.maplibregl-canvas]:contrast-[1.4] [&_.maplibregl-canvas]:hue-rotate-[200deg]">
        <Map
          mapLib={maplibregl}
          initialViewState={{
            longitude: center.lng,
            latitude: center.lat,
            zoom: 14,
          }}
          mapStyle={mapcnDarkStyle}
          className="w-full h-full"
        >
          <NavigationControl position="top-right" />

          {/* User Location Marker */}
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-zinc-950 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse" />
            </Marker>
          )}

          {/* Cafe Markers */}
          {cafes?.map((cafe) => {
            let coords = defaultCenter;
            if (cafe.location) {
              const [lat, lng] = cafe.location.split(',');
              coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
            } else if (cafeCoordinates[cafe.name]) {
              coords = cafeCoordinates[cafe.name];
            }

            if (!coords.lat || !coords.lng) return null;

            return (
              <Marker
                key={cafe.id}
                longitude={coords.lng}
                latitude={coords.lat}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedCafe({ cafe, coords });
                }}
              >
                <div className="w-9 h-9 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300/30 cursor-pointer hover:scale-110 transition-transform">
                  ☕
                </div>
              </Marker>
            );
          })}

          {/* Selected Cafe Popup */}
          {selectedCafe && (
            <Popup
              longitude={selectedCafe.coords.lng}
              latitude={selectedCafe.coords.lat}
              anchor="bottom"
              onClose={() => setSelectedCafe(null)}
              closeOnClick={false}
              className="text-zinc-950"
            >
              <div className="flex flex-col gap-2 min-w-[180px] p-1">
                <strong className="text-zinc-900 text-sm font-bold">{selectedCafe.cafe.name}</strong>
                {selectedCafe.cafe.description && (
                  <p className="text-xs text-zinc-600 line-clamp-2">{selectedCafe.cafe.description}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <Link
                    href={`/cafe/${selectedCafe.cafe.id}`}
                    className="flex-1 bg-zinc-900 text-white text-xs py-1.5 px-2 rounded-lg text-center no-underline hover:bg-zinc-800 transition-colors"
                  >
                    Details
                  </Link>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCafe.coords.lat},${selectedCafe.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-amber-500 text-zinc-950 text-xs py-1.5 px-2 rounded-lg text-center no-underline font-semibold hover:bg-amber-400 transition-colors"
                  >
                    Directions ↗
                  </a>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}