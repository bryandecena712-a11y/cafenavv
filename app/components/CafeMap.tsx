'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';

// Hardcoded coordinates since the DB doesn't have lat/lng yet
const cafeCoordinates: Record<string, { lat: number; lng: number }> = {
  "Grind. Coffee": { lat: 14.2144, lng: 121.1627 },
  "Usual Coffee": { lat: 14.2114, lng: 121.1648 },
  "250 Cafe": { lat: 14.2116, lng: 121.1644 },
  "Bo's Coffee": { lat: 14.1950, lng: 121.1730 }
};

interface CafeMapProps {
  cafes: any[];
}

export default function CafeMap({ cafes }: CafeMapProps) {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    // In production, this should be accessed from process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    // For prototyping, the user will define it in their environment
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    }
  }, []);

  if (!apiKey) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-zinc-900 rounded-2xl border border-zinc-800 text-center p-8 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <span className="text-zinc-400">📍</span>
        </div>
        <h3 className="text-xl font-medium text-zinc-200 mb-2">Map is ready to connect</h3>
        <p className="text-zinc-400 text-sm max-w-sm">
          Please add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code>.env.local</code> file with your Maps Demo Key to enable the interactive map.
        </p>
      </div>
    );
  }

  // Calculate center of all cafes, default to Calamba center
  const center = { lat: 14.2114, lng: 121.1648 };

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl shadow-black/50">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
          disableDefaultUI={true}
        >
          {cafes.map((cafe) => {
            const coords = cafeCoordinates[cafe.name] || center;
            return (
              <AdvancedMarker key={cafe.id} position={coords} title={cafe.name}>
                <div className="group relative z-10 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-zinc-950 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <span className="text-zinc-950 font-bold text-[10px] block">☕</span>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-xs font-semibold text-zinc-100">{cafe.name}</p>
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
}
