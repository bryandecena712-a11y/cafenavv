'use client';

import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import { cafeCoordinates, defaultCenter } from '@/app/lib/coordinates';

interface CafeMapProps {
  cafes: any[];
}

// Sub-component to handle Google Maps Directions Service & Renderer
function Directions({ origin, destination }: { origin: { lat: number; lng: number } | null; destination: { lat: number; lng: number } | null }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (!origin || !destination) {
      directionsRenderer.setDirections({ routes: [] });
      return;
    }

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [directionsService, directionsRenderer, origin, destination]);

  return null;
}

export default function CafeMap({ cafes }: CafeMapProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedCafe, setSelectedCafe] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    }
  }, []);

  // Fetch real-time user location
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.warn('Geolocation access failed:', error)
      );
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
          Please add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code>.env.local</code> file to enable the interactive map.
        </p>
      </div>
    );
  }

  const center = userLocation || defaultCenter;

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl shadow-black/50">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_git_agentskills_v1']}
          disableDefaultUI={true}
        >
          {/* User Location Marker */}
          {userLocation && (
            <AdvancedMarker position={userLocation} title="Your Location">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </AdvancedMarker>
          )}

          {/* Cafe Markers */}
          {cafes.map((cafe) => {
            let coords = defaultCenter;
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
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                      selectedCafe?.id === cafe.id ? 'bg-amber-400 border-white scale-110' : 'bg-amber-500 border-zinc-950'
                    }`}
                  >
                    <span className="text-zinc-950 font-bold text-[10px] block">☕</span>
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Info Window */}
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

                <div className="flex gap-2">
                  <Link
                    href={`/cafe/${selectedCafe.id}`}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold py-2 px-3 rounded-xl text-center transition-colors shadow-sm"
                  >
                    Details
                  </Link>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCafe.coords.lat},${selectedCafe.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold py-2 px-3 rounded-xl text-center transition-colors shadow-sm"
                  >
                    Open Maps ↗
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Directions Layer */}
          <Directions
            origin={userLocation}
            destination={selectedCafe ? selectedCafe.coords : null}
          />
        </Map>
      </APIProvider>
    </div>
  );
}