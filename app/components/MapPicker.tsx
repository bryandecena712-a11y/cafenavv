'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon issues in Next.js
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationMarker({ position, setPosition }: { position: { lat: number; lng: number }; setPosition: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} icon={customIcon} /> : null;
}

export default function MapPicker({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number };
  setPosition: (pos: { lat: number; lng: number }) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-60 bg-zinc-900 animate-pulse rounded-xl" />;

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="h-60 w-full rounded-xl z-10"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} setPosition={setPosition} />
    </MapContainer>
  );
}