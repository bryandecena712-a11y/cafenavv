'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet map to avoid SSR window/document issues
const LocationPickerMap = dynamic(() => import('@/app/components/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-zinc-900 animate-pulse rounded-xl flex items-center justify-center text-zinc-500 text-xs">
      Loading Interactive Map...
    </div>
  ),
});

export default function SuggestPage() {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    price_level: '₱₱ (Moderate)',
    vibe: 'Chill',
    image_url: '',
    lat: 14.212,
    lng: 121.1677,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/cafes/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit cafe suggestion');
      }

      alert('Cafe suggested successfully! It will appear on the map once approved by an admin.');

      setFormData({
        name: '',
        location: '',
        description: '',
        price_level: '₱₱ (Moderate)',
        vibe: 'Chill',
        image_url: '',
        lat: 14.212,
        lng: 121.1677,
      });
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to submit cafe suggestion'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="w-full max-w-xl bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cafe Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Cafe Name <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Starbucks"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </div>

          {/* Pin to Map Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                📍 Pin to Map <span className="text-amber-500">*</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                Lat: {formData.lat.toFixed(4)}, Lng: {formData.lng.toFixed(4)}
              </span>
            </div>
            <div className="w-full h-52 rounded-xl overflow-hidden border border-zinc-800 relative bg-zinc-950">
              <LocationPickerMap
                lat={formData.lat}
                lng={formData.lng}
                onSelectLocation={handleLocationSelect}
              />
            </div>
          </div>

          {/* Location / City */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Location / City <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Calamba, Laguna"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">Description</label>
            <textarea
              rows={3}
              placeholder="What makes this place special?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-colors resize-none"
            />
          </div>

          {/* Price Level & Vibe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">Price Level</label>
              <select
                value={formData.price_level}
                onChange={(e) => setFormData({ ...formData, price_level: e.target.value })}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-colors"
              >
                <option value="₱ (Budget)">₱ (Budget)</option>
                <option value="₱₱ (Moderate)">₱₱ (Moderate)</option>
                <option value="₱₱₱ (Expensive)">₱₱₱ (Expensive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">Vibe</label>
              <select
                value={formData.vibe}
                onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-colors"
              >
                <option value="Chill">Chill</option>
                <option value="Work">Work</option>
                <option value="Cozy">Cozy</option>
                <option value="Aesthetic">Aesthetic</option>
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">Image URL</label>
            <input
              type="text"
              placeholder="https://..."
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Cafe Suggestion'}
          </button>
        </form>
      </div>
    </main>
  );
}