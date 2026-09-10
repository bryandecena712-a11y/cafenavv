'use client';

import { useEffect, useState, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; 
import Link from 'next/link';

import { cafeCoordinates, defaultCenter } from '@/app/lib/coordinates';

interface CafeMapProps {
  cafes: any[];
}

// Native dark vector style (no CSS filters required)
const darkMapStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function CafeMap({ cafes }: CafeMapProps) {
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<{ cafe: any; coords: { lat: number; lng: number } } | null>(null);
  
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{ duration: string; distance: string; destinationName: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

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

  const handleGetDirections = async (destLat: number, destLng: number, cafeName: string) => {
    if (!userLocation) {
      alert('Please enable location access in your browser to view driving directions.');
      return;
    }

    setLoadingRoute(true);

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destLng},${destLat}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        const durationMin = Math.round(route.duration / 60);
        const distanceKm = (route.distance / 1000).toFixed(1);

        setRouteInfo({
          duration: `${durationMin} min`,
          distance: `${distanceKm} km`,
          destinationName: cafeName
        });

        setRouteGeoJSON({
          type: 'Feature',
          properties: {},
          geometry: route.geometry,
        });

        if (mapRef.current) {
          const map = mapRef.current.getMap();
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend([userLocation.lng, userLocation.lat]);
          bounds.extend([destLng, destLat]);
          map.fitBounds(bounds, { padding: 90, maxZoom: 15 });
        }
      } else {
        alert('Could not calculate a driving route to this destination.');
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      alert('Failed to connect to directions service.');
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative bg-black">
      
      {/* Route Info Badge Overlay */}
      {routeInfo && (
        <div className="absolute top-4 left-4 z-20 bg-zinc-900/95 backdrop-blur-md border border-amber-500/30 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-lg">
            🚗
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-medium">Fastest Route to <span className="text-zinc-200">{routeInfo.destinationName}</span></div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-amber-400 font-extrabold text-base">{routeInfo.duration}</span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-zinc-300 font-semibold text-sm">{routeInfo.distance}</span>
            </div>
          </div>
          <button 
            onClick={() => { setRouteGeoJSON(null); setRouteInfo(null); }}
            className="ml-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-full border-none cursor-pointer text-xs"
            title="Clear Route"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map Container without CSS Filters */}
      <div className="w-full h-full">
        <Map
          ref={mapRef}
          mapLib={maplibregl as any}
          initialViewState={{
            longitude: center.lng,
            latitude: center.lat,
            zoom: 14,
          }}
          mapStyle={darkMapStyle}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />

          {/* User Location Marker */}
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,1)] animate-pulse z-10" />
                <div className="absolute w-8 h-8 bg-blue-500/40 rounded-full animate-ping" />
              </div>
            </Marker>
          )}

          {/* Cafe Markers */}
          {cafes?.map((cafe) => {
            let lat: number | null = null;
            let lng: number | null = null;

            if (cafe.latitude !== undefined && cafe.longitude !== undefined && cafe.latitude !== null) {
              lat = parseFloat(cafe.latitude);
              lng = parseFloat(cafe.longitude);
            } else if (cafe.lat !== undefined && cafe.lng !== undefined && cafe.lat !== null) {
              lat = parseFloat(cafe.lat);
              lng = parseFloat(cafe.lng);
            } else if (cafe.location && typeof cafe.location === 'string' && cafe.location.includes(',')) {
              const parts = cafe.location.split(',');
              lat = parseFloat(parts[0].trim());
              lng = parseFloat(parts[1].trim());
            } else if (cafeCoordinates[cafe.name]) {
              lat = cafeCoordinates[cafe.name].lat;
              lng = cafeCoordinates[cafe.name].lng;
            }

            if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
              return null;
            }

            const coords = { lat, lng };

            return (
              <Marker
                key={cafe.id || cafe.name}
                longitude={coords.lng}
                latitude={coords.lat}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedCafe({ cafe, coords });
                }}
              >
                <div className="w-9 h-9 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(245,158,11,0.6)] border border-amber-300/40 cursor-pointer hover:scale-110 transition-transform">
                  ☕
                </div>
              </Marker>
            );
          })}

          {/* High-Visibility Blue Route Line */}
          {routeGeoJSON && (
            <Source id="route-source" type="geojson" data={routeGeoJSON}>
              {/* Black Outer Casing */}
              <Layer
                id="route-casing"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#000000',
                  'line-width': 10,
                  'line-opacity': 0.9,
                }}
              />
              {/* Bright Google-Maps Style Blue Line */}
              <Layer
                id="route-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#3b82f6',
                  'line-width': 6,
                  'line-opacity': 1,
                }}
              />
            </Source>
          )}

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
              <div className="flex flex-col gap-2 min-w-[200px] max-w-[240px] p-1">
                {selectedCafe.cafe.image_url && (
                  <div className="w-full h-24 rounded-lg overflow-hidden bg-zinc-800">
                    <img
                      src={selectedCafe.cafe.image_url}
                      alt={selectedCafe.cafe.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <strong className="text-zinc-900 text-sm font-bold">{selectedCafe.cafe.name}</strong>
                {selectedCafe.cafe.description && (
                  <p className="text-xs text-zinc-600 line-clamp-2">{selectedCafe.cafe.description}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <Link
                    href={`/cafe/${selectedCafe.cafe.id}`}
                    className="flex-1 bg-zinc-900 text-white text-xs py-1.5 px-2 rounded-lg text-center no-underline hover:bg-zinc-800 transition-colors font-medium flex items-center justify-center"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleGetDirections(selectedCafe.coords.lat, selectedCafe.coords.lng, selectedCafe.cafe.name)}
                    disabled={loadingRoute}
                    className="flex-1 bg-amber-500 text-zinc-950 text-xs py-1.5 px-2 rounded-lg text-center font-semibold hover:bg-amber-400 transition-colors border-none cursor-pointer flex items-center justify-center"
                  >
                    {loadingRoute ? 'Loading...' : 'Directions ↗'}
                  </button>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}