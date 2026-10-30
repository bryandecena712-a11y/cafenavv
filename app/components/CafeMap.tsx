'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
// @ts-ignore
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';

import { cafeCoordinates, defaultCenter } from '@/app/lib/coordinates';
import { getCachedDirections, getDirections, prefetchRoutes } from '@/app/lib/directionsService';

interface CafeMapProps {
  cafes: any[];
}

const openStreetMapStyle = {
  version: 8 as const,
  sources: {
    'osm-tiles': {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster' as const,
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function getStraightLineDistanceKm(startLat: number, startLng: number, endLat: number, endLng: number) {
  const earthRadius = 6371;
  const latitudeDelta = ((endLat - startLat) * Math.PI) / 180;
  const longitudeDelta = ((endLng - startLng) * Math.PI) / 180;
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos((startLat * Math.PI) / 180) *
      Math.cos((endLat * Math.PI) / 180) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export default function CafeMap({ cafes }: CafeMapProps) {
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<{ cafe: any; coords: { lat: number; lng: number } } | null>(null);
  const [geocodedCafes, setGeocodedCafes] = useState<{ [key: string]: { lat: number; lng: number } }>({});
  const [isLocating, setIsLocating] = useState(false);

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [svgPath, setSvgPath] = useState<string>('');
  const [transportMode, setTransportMode] = useState<'car' | 'two-wheeler' | 'walk'>('car');
  const [routeInfo, setRouteInfo] = useState<{
    duration: string;
    distance: string;
    destinationName: string;
    trafficLevel: string;
  } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Handle URL hash params for "Locate Now" from offers/survey page
  useEffect(() => {
    if (typeof window === 'undefined' || !cafes || cafes.length === 0 || !userLocation) return;
    
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('lat=') || hash.includes('name=')) {
        try {
          const mapSectionElem = document.getElementById('map-section') || document.getElementById('map');
          if (mapSectionElem) {
            mapSectionElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          let queryPart = hash.includes('?') ? hash.split('?')[1] : '';
          const params = new URLSearchParams(queryPart);
          const name = params.get('name') ? decodeURIComponent(params.get('name')!) : '';
          let lat = parseFloat(params.get('lat') || '');
          let lng = parseFloat(params.get('lng') || '');

          let coords: { lat: number; lng: number } | null = null;
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            coords = { lat, lng };
          } else if (name) {
            // First, try to find the cafe in the database-fetched cafes array to get the most accurate, up-to-date coordinates
            const foundCafe = cafes.find((c) => (c.name || '').toLowerCase() === name.toLowerCase());
            if (foundCafe) {
              coords = getCafeCoords(foundCafe);
            }

            // Fallback to hardcoded coordinates if not found in database or if database coords are missing
            if (!coords) {
              if (cafeCoordinates[name]) {
                coords = cafeCoordinates[name];
              } else {
                const matchedKey = Object.keys(cafeCoordinates).find(
                  (k) => k.toLowerCase() === name.toLowerCase() || k.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.toLowerCase())
                );
                if (matchedKey) coords = cafeCoordinates[matchedKey];
              }
            }
          }

          if (coords && name) {
            const targetLat = coords.lat;
            const targetLng = coords.lng;

            if (mapRef.current) {
              const map = mapRef.current.getMap();
              if (map) map.easeTo({ center: [targetLng, targetLat], zoom: 16, duration: 1000 });
            }
            const foundCafe = cafes.find((c) => (c.name || '').toLowerCase() === name.toLowerCase()) || { name, id: 'survey-target' };
            setSelectedCafe({ cafe: foundCafe, coords: { lat: targetLat, lng: targetLng } });
            
            // Call directions directly
            // Explicitly pass the user location as the start point for the calculation
            handleGetDirections(targetLat, targetLng, name);
            
            window.history.replaceState(null, '', window.location.pathname);
          }
        } catch (e) {
          console.warn('Failed to parse map hash params:', e);
        }
      }
    };

    checkHash();
  }, [userLocation, cafes]); // Trigger only when location and cafes data are fully ready
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setUserLocation(defaultCenter);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation watch failed, using default center:', error);
        if (!userLocation) {
          setUserLocation(defaultCenter);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Instant fast-response location centering
  const handleFindMyLocation = () => {
    setIsLocating(true);

    const panToCoords = (lat: number, lng: number) => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        if (map) {
          map.easeTo({
            center: [lng, lat],
            zoom: 16,
            duration: 500, // Fast 0.5s transition
            essential: true,
          });
        }
      }
    };

    // Immediate action: If we already have a recent location state, start panning instantly!
    if (userLocation) {
      panToCoords(userLocation.lat, userLocation.lng);
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          panToCoords(loc.lat, loc.lng);
          setIsLocating(false);
        },
        (error) => {
          console.warn('getCurrentPosition error:', error);
          if (userLocation) {
            panToCoords(userLocation.lat, userLocation.lng);
          }
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 5000, // Instant return if location fetched in last 5 secs
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Pre-cache routes in background
  useEffect(() => {
    if (userLocation && cafes && Array.isArray(cafes) && cafes.length > 0 && typeof window !== 'undefined' && navigator.onLine) {
      prefetchRoutes([userLocation.lng, userLocation.lat], cafes).catch((err) => {
        console.warn('Background route prefetching skipped:', err);
      });
    }
  }, [userLocation, cafes]);

  const getCafeCoords = (cafe: any): { lat: number; lng: number } | null => {
    if (cafe.latitude != null && cafe.longitude != null) {
      const lat = parseFloat(cafe.latitude);
      const lng = parseFloat(cafe.longitude);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    if (cafe.lat != null && cafe.lng != null) {
      const lat = parseFloat(cafe.lat);
      const lng = parseFloat(cafe.lng);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    if (cafe.location && typeof cafe.location === 'string' && cafe.location.includes(',')) {
      const parts = cafe.location.split(',');
      if (parts.length === 2) {
        const pLat = parseFloat(parts[0].trim());
        const pLng = parseFloat(parts[1].trim());
        if (!isNaN(pLat) && !isNaN(pLng)) return { lat: pLat, lng: pLng };
      }
    }

    if (cafeCoordinates[cafe.name]) {
      return cafeCoordinates[cafe.name];
    }

    const identifier = cafe.id || cafe.name;
    if (geocodedCafes[identifier]) {
      return geocodedCafes[identifier];
    }

    return null;
  };

  useEffect(() => {
    if (!cafes || cafes.length === 0 || !navigator.onLine) return;

    cafes.forEach(async (cafe) => {
      const existing = getCafeCoords(cafe);
      if (existing) return;

      const identifier = cafe.id || cafe.name;

      try {
        const searchQuery = encodeURIComponent(`${cafe.name}, ${cafe.location || 'Calamba, Laguna'}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
        const data = await res.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setGeocodedCafes((prev) => ({ ...prev, [identifier]: { lat, lng } }));
        }
      } catch (e) {
        console.error('Geocoding fallback failed for:', cafe.name);
      }
    });
  }, [cafes]);

  const center = userLocation || defaultCenter;

  const updateSvgOverlay = useCallback(() => {
    if (!routeCoordinates || !mapRef.current) {
      setSvgPath('');
      return;
    }

    const map = mapRef.current.getMap();
    if (!map) return;

    const points = routeCoordinates.map((coord) => {
      const pixel = map.project([coord[0], coord[1]]);
      return `${pixel.x.toFixed(1)},${pixel.y.toFixed(1)}`;
    });

    setSvgPath(`M ${points.join(' L ')}`);
  }, [routeCoordinates]);

  useEffect(() => {
    updateSvgOverlay();
  }, [routeCoordinates, updateSvgOverlay]);

  const handleGetDirections = async (destLat: number, destLng: number, cafeName: string, modeOverride?: 'car' | 'two-wheeler' | 'walk') => {
    const startPoint = userLocation || defaultCenter;

    setLoadingRoute(true);

    const start: [number, number] = [startPoint.lng, startPoint.lat];
    const end: [number, number] = [destLng, destLat];

    const currentMode = modeOverride || transportMode;

    // Map internal mode to OSRM profile (walking uses foot profile or walking speed factor)
    const osrmMode = currentMode === 'walk' ? 'walking' : 'driving';

    try {
      const route = await getDirections(start, end, 8000, osrmMode);
      const coords: [number, number][] = route.geometry.coordinates;

      const distanceKm = route.distance / 1000;
      let adjustedDurationMin = 0;
      let trafficText = 'Clear path';

      const currentHour = new Date().getHours();

      if (currentMode === 'walk') {
        // Standard human walking speed: ~4.5 km/h + terrain/sidewalk factor (~1.25x)
        const walkingSpeedKmh = 4.5;
        adjustedDurationMin = Math.round((distanceKm / walkingSpeedKmh) * 60 * 1.25);
        trafficText = distanceKm > 3 ? 'Long walk ahead' : 'Pedestrian friendly';
      } else if (currentMode === 'two-wheeler') {
        const baseMin = route.duration / 60;
        let multiplier = 1.15;
        if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 20)) {
          multiplier = 1.35;
          trafficText = 'Moderate Traffic';
        } else {
          trafficText = 'Light Traffic';
        }
        adjustedDurationMin = Math.round(baseMin * multiplier);
      } else {
        // Car
        const baseMin = route.duration / 60;
        let multiplier = 1.25;
        if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 20)) {
          multiplier = 1.75;
          trafficText = 'Heavy Traffic (Peak Hours)';
        } else if (currentHour >= 22 || currentHour <= 5) {
          multiplier = 1.05;
          trafficText = 'Light Traffic';
        } else {
          trafficText = 'Moderate Traffic';
        }
        adjustedDurationMin = Math.round(baseMin * multiplier);
      }

      setRouteInfo({
        duration: adjustedDurationMin >= 60 ? `${Math.floor(adjustedDurationMin / 60)} hr ${adjustedDurationMin % 60} min` : `${adjustedDurationMin} min`,
        distance: `${distanceKm.toFixed(1)} km`,
        destinationName: cafeName,
        trafficLevel: trafficText,
      });

      setRouteCoordinates(coords);

      if (mapRef.current) {
        const map = mapRef.current.getMap();
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([startPoint.lng, startPoint.lat]);
        bounds.extend([destLng, destLat]);
        map.fitBounds(bounds, { padding: 90, maxZoom: 15 });
      }
    } catch {
      const cachedRoute = getCachedDirections(start, end, osrmMode);
      const distanceKm = getStraightLineDistanceKm(startPoint.lat, startPoint.lng, destLat, destLng);
      
      let speedKmh = 30;
      let multiplier = 1.2;
      let trafficText = 'Standard Route';

      if (currentMode === 'walk') {
        speedKmh = 4.5;
        multiplier = 1.25;
        trafficText = 'Pedestrian Route';
      } else if (currentMode === 'two-wheeler') {
        speedKmh = 25;
        multiplier = 1.15;
        trafficText = 'Light Traffic';
      } else {
        speedKmh = 30;
        multiplier = 1.5;
        trafficText = 'Moderate Traffic';
      }

      const estimatedMinutes = Math.max(1, Math.round((distanceKm / speedKmh) * 60 * multiplier));

      if (cachedRoute && currentMode !== 'walk') {
        setRouteInfo({
          duration: `${Math.round((cachedRoute.duration / 60) * multiplier)} min`,
          distance: `${(cachedRoute.distance / 1000).toFixed(1)} km`,
          destinationName: cafeName,
          trafficLevel: trafficText,
        });
        setRouteCoordinates(cachedRoute.geometry.coordinates);
        return;
      }

      setRouteInfo({
        duration: estimatedMinutes >= 60 ? `${Math.floor(estimatedMinutes / 60)} hr ${estimatedMinutes % 60} min` : `${estimatedMinutes} min`,
        distance: `${distanceKm.toFixed(1)} km`,
        destinationName: cafeName,
        trafficLevel: trafficText,
      });
      setRouteCoordinates([[startPoint.lng, startPoint.lat], [destLng, destLat]]);
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative bg-zinc-900">
        
        {/* Top-Left Map Instruction Overlay */}
        {!routeInfo && (
          <div style={{ zIndex: 9998 }} className="absolute top-4 left-4 pointer-events-none">
            <div className="bg-zinc-950/85 backdrop-blur-md border border-amber-500/30 text-amber-400 font-semibold text-xs px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Click any cafe icon on the map to preview details</span>
            </div>
          </div>
        )}

        {/* Route Info Overlay */}
        {routeInfo && (
          <div style={{ zIndex: 9999 }} className="absolute top-4 left-4 bg-zinc-900/95 border border-blue-500/40 text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[280px] max-w-[340px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  {transportMode === 'car' ? '🚗' : transportMode === 'two-wheeler' ? '🛵' : '🚶'}
                </div>
                <div>
                  <div className="text-xs text-zinc-400 font-medium truncate max-w-[180px]">
                    Route to <span className="text-zinc-200">{routeInfo.destinationName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-blue-400 font-extrabold text-base">{routeInfo.duration}</span>
                    <span className="text-zinc-500 text-xs">•</span>
                    <span className="text-zinc-300 font-semibold text-sm">{routeInfo.distance}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setRouteCoordinates(null);
                  setSvgPath('');
                  setRouteInfo(null);
                }}
                className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-full border-none cursor-pointer text-xs"
                title="Clear Route"
              >
                ✕
              </button>
            </div>

            <div className="text-[11px] text-amber-400 font-medium">
              ⚡ {routeInfo.trafficLevel}
            </div>

            {/* Transport Mode Selector Tabs (Car, Two-Wheeler, Walk) */}
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => {
                  setTransportMode('car');
                  if (selectedCafe) handleGetDirections(selectedCafe.coords.lat, selectedCafe.coords.lng, selectedCafe.cafe.name, 'car');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${transportMode === 'car' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              >
                <span>🚗</span> Car
              </button>
              <button
                onClick={() => {
                  setTransportMode('two-wheeler');
                  if (selectedCafe) handleGetDirections(selectedCafe.coords.lat, selectedCafe.coords.lng, selectedCafe.cafe.name, 'two-wheeler');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${transportMode === 'two-wheeler' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              >
                <span>🛵</span> Two-Wheeler
              </button>
              <button
                onClick={() => {
                  setTransportMode('walk');
                  if (selectedCafe) handleGetDirections(selectedCafe.coords.lat, selectedCafe.coords.lng, selectedCafe.cafe.name, 'walk');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${transportMode === 'walk' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              >
                <span>🚶</span> Walk
              </button>
            </div>
          </div>
        )}

        {/* High-Performance Instant Response "Find My Location" Button */}
        <button
          onClick={handleFindMyLocation}
          type="button"
          disabled={isLocating}
          title="Find My Location"
          style={{ zIndex: 9999 }}
          className="absolute bottom-6 right-6 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold cursor-pointer active:scale-95 transition-all border border-amber-300/50 disabled:opacity-80"
        >
          <span className={`text-sm ${isLocating ? 'animate-spin' : ''}`}>📍</span>
          {isLocating ? 'Locating...' : 'Find My Location'}
        </button>

        {svgPath && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            <path
              d={svgPath}
              fill="none"
              stroke="#0f172a"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            <path
              d={svgPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="1"
            />
          </svg>
        )}

        <div className="w-full h-full">
          <Map
            ref={mapRef}
            mapLib={maplibregl as any}
            initialViewState={{
              longitude: center.lng,
              latitude: center.lat,
              zoom: 14,
            }}
            mapStyle={openStreetMapStyle}
            style={{ width: '100%', height: '100%' }}
            onMove={updateSvgOverlay}
            onZoom={updateSvgOverlay}
          >
            <NavigationControl position="top-right" />

            {/* User Real-Time Location Marker */}
            {userLocation && (
              <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-[0_0_12px_rgba(37,99,235,0.8)] animate-pulse z-10" />
                  <div className="absolute w-8 h-8 bg-blue-400/40 rounded-full animate-ping" />
                </div>
              </Marker>
            )}

            {cafes?.map((cafe) => {
              const coords = getCafeCoords(cafe);
              if (!coords) return null;

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

            {selectedCafe && (
              <Popup
                longitude={selectedCafe.coords.lng}
                latitude={selectedCafe.coords.lat}
                anchor="bottom"
                onClose={() => setSelectedCafe(null)}
                closeOnClick={false}
                className="text-zinc-950 z-30"
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
                      onClick={() =>
                        handleGetDirections(selectedCafe.coords.lat, selectedCafe.coords.lng, selectedCafe.cafe.name)
                      }
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
    </div>
  );
}