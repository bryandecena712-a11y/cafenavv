'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

import { cafeCoordinates, defaultCenter } from '@/app/lib/coordinates';

// Fix default Leaflet icon assets in Next.js
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface CafeMapProps {
  cafes: any[];
}

export default function CafeMap({ cafes }: CafeMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl z-0 relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={customIcon}>
            <Popup>You are here</Popup>
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

          return (
            <Marker key={cafe.id} position={[coords.lat, coords.lng]} icon={customIcon}>
              <Popup>
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <strong className="text-zinc-900 text-sm">{cafe.name}</strong>
                  {cafe.description && <p className="text-xs text-zinc-600 line-clamp-2">{cafe.description}</p>}
                  <div className="flex gap-2 mt-1">
                    <Link
                      href={`/cafe/${cafe.id}`}
                      className="flex-1 bg-zinc-800 text-white text-xs py-1 px-2 rounded text-center no-underline"
                    >
                      Details
                    </Link>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-amber-500 text-zinc-950 text-xs py-1 px-2 rounded text-center no-underline"
                    >
                      Directions ↗
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}