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
    lat: 14.2117,
    lng: 121.1654,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

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

      setMessage({
        type: 'success',
        text: 'Cafe suggestion submitted successfully! It will appear on the map once approved by an admin.',
      });

      setFormData({
        name: '',
        location: '',
        description: '',
        price_level: '₱₱',
        vibe: 'chill',
        image_url: '',
        lat: 14.2117,
        lng: 121.1654,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-500">Suggest a Cafe</h1>
          <Link href="/" className="text-xs text-zinc-400 hover:text-white">
            ← Back Home
          </Link>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Cafe Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Daily Roast"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Location / City *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Calamba, Laguna"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="Tell us about this spot..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Price Level</label>
              <select
                value={formData.price_level}
                onChange={(e) => setFormData({ ...formData, price_level: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="chill">Chill</option>
                <option value="work">Work Friendly</option>
                <option value="cozy">Cozy</option>
                <option value="aesthetic">Aesthetic</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      </div>
    </div>
  );
}