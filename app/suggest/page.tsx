'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SuggestPage() {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    price_level: '₱₱',
    vibe: 'chill',
    image_url: '',
    latitude: '14.2117',
    longitude: '121.1654',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/cafes', {
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
        price_level: '₱₱',
        vibe: 'chill',
        image_url: '',
        latitude: '14.2117',
        longitude: '121.1654',
      });
    } catch (err: any) {
      alert(err.message || 'Error submitting suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 py-12 px-4 sm:px-6 flex justify-center items-center">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Suggest a Cafe</h1>
          <Link href="/" className="text-xs text-amber-500 hover:underline">
            &larr; Back to Map
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Cafe Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Daily Grind Cafe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Location / City *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Calamba, Laguna"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="Cozy place with outdoor seating..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Price Level</label>
              <select
                value={formData.price_level}
                onChange={(e) => setFormData({ ...formData, price_level: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="₱">₱ (Budget)</option>
                <option value="₱₱">₱₱ (Moderate)</option>
                <option value="₱₱₱">₱₱₱ (Premium)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Vibe</label>
              <select
                value={formData.vibe}
                onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="chill">Chill</option>
                <option value="work">Work / Study</option>
                <option value="social">Social</option>
                <option value="aesthetic">Aesthetic</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Image URL</label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Cafe Suggestion'}
          </button>
        </form>
      </div>
    </main>
  );
}