'use client';

import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import { cafeCoordinates, defaultCenter } from '@/app/lib/coordinates';

interface CafeMapProps {
  cafes: any[];
}

export default function CafeMap({ cafes }: CafeMapProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedCafe, setSelectedCafe] = useState<any>(null);

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
  const center = defaultCenter;

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
            let coords = center;
            if (cafe.location) {
              const [lat, lng] = cafe.location.split(',');
              coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
            } else if (cafeCoordinates[cafe.name]) {
              coords = cafeCoordinates[cafe.name];
            }
            
            return (
              <AdvancedMarker 
                key={cafe.id} 
                position={coords} 
                title={cafe.name}
                onClick={() => setSelectedCafe({ ...cafe, coords })}
              >
                <div className="group relative z-10 cursor-pointer">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${selectedCafe?.id === cafe.id ? 'bg-amber-400 border-white scale-110' : 'bg-amber-500 border-zinc-950'}`}>
                    <span className="text-zinc-950 font-bold text-[10px] block">☕</span>
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}
          
          {selectedCafe && (
            <InfoWindow
              position={selectedCafe.coords}
              onCloseClick={() => setSelectedCafe(null)}
              headerContent={<div className="font-semibold text-zinc-900 pr-4">{selectedCafe.name}</div>}
            >
              <div className="flex flex-col gap-3 min-w-[200px] pb-1">
                {selectedCafe.image_url ? (
                  <img src={selectedCafe.image_url} alt={selectedCafe.name} className="w-full h-32 object-cover rounded-xl shadow-sm" />
                ) : (
                  <div className="w-full h-32 bg-zinc-100 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-4xl">☕</span>
                  </div>
                )}
                
                {selectedCafe.description && (
                  <p className="text-sm text-zinc-600 line-clamp-2">{selectedCafe.description}</p>
                )}
                
                <Link 
                  href={`/cafe/${selectedCafe.id}`}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold py-2 px-4 rounded-xl text-center transition-colors shadow-sm"
                >
                  View Details
                </Link>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
