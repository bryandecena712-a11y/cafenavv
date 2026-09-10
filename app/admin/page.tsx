'use client';

import { useState, useEffect } from 'react';
import ManageCafes from './components/ManageCafes';

export default function AdminPage() {
  const [pendingSuggestions, setPendingSuggestions] = useState<any[]>([]);
  const [discoveredCafes, setDiscoveredCafes] = useState<any[]>([]);

  // Fetch pending menu suggestions
  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        const pending = Array.isArray(data)
          ? data.filter(
              (item: any) =>
                item.status === 'PENDING' ||
                item.status === 'pending' ||
                !item.status
            )
          : [];
        setPendingSuggestions(pending);
      }
    } catch (err) {
      console.error('Failed to fetch menu suggestions:', err);
    }
  };

  // Fetch discovered cafes from OpenStreetMap sync queue
  const fetchDiscovered = async () => {
    try {
      const res = await fetch('/api/admin/discovered');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDiscoveredCafes(data);
      }
    } catch (err) {
      console.error('Failed to fetch discovered cafes:', err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    fetchDiscovered();
  }, []);

  // Handle menu item approvals/rejections
  const handleAction = async (productId: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        const res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: productId, status: 'APPROVED' }),
        });
        if (res.ok) fetchSuggestions();
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: productId }),
        });
        if (res.ok) fetchSuggestions();
      }
    } catch (err) {
      console.error('Failed to update menu suggestion:', err);
    }
  };

  // Handle discovered cafe approvals/dismissals
  const handleDiscoveredAction = async (id: number, action: 'APPROVE' | 'DISMISS') => {
    try {
      const res = await fetch('/api/admin/discovered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });

      const data = await res.json();

      if (res.ok) {
        setDiscoveredCafes((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(`Error: ${data.error || 'Failed to process action'}`);
      }
    } catch (err) {
      console.error('Failed to update discovered cafe:', err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Manage Cafes</h1>
        <p className="text-zinc-400 mt-2">Add, edit, or remove cafes and their menus.</p>
      </div>

      {/* Discovered Cafes Queue Section */}
      {discoveredCafes.length > 0 && (
        <div className="mb-10">
          <h2 className="text-amber-500 font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
            Discovered Cafes via OpenStreetMap ({discoveredCafes.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoveredCafes.map((item) => (
              <div
                key={item.id}
                className="bg-[#191512] border border-[#2b221b] rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg">
                      ☕
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{item.name}</h3>
                      <p className="text-neutral-400 text-xs mt-1">
                        Location: <span className="text-amber-500 font-medium">{item.location}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-neutral-400 text-xs italic mb-4">
                    Source: {item.source}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => handleDiscoveredAction(item.id, 'APPROVE')}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 rounded-xl text-sm transition cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDiscoveredAction(item.id, 'DISMISS')}
                    className="bg-[#2d1b1b] hover:bg-[#3d2020] text-red-400 font-semibold py-2 rounded-xl text-sm border border-red-900/30 transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Menu Suggestions Section */}
      {pendingSuggestions.length > 0 && (
        <div className="mb-10">
          <h2 className="text-amber-500 font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            Pending Menu Approvals ({pendingSuggestions.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingSuggestions.map((item) => (
              <div
                key={item.id}
                className="bg-[#191512] border border-[#2b221b] rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-xs text-neutral-500">
                        No image
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{item.name}</h3>
                      <p className="text-neutral-400 text-xs mt-1">
                        Cafe: <span className="text-amber-500 font-medium">{item.cafe?.name || 'Unknown'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <span className="bg-[#241e19] text-amber-500 font-bold text-xs px-2.5 py-1 rounded-md border border-[#362a20]">
                      ₱{item.price || 0}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-neutral-400 text-xs italic mb-4">
                      "{item.description}"
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => handleAction(item.id, 'approve')}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 rounded-xl text-sm transition cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'reject')}
                    className="bg-[#2d1b1b] hover:bg-[#3d2020] text-red-400 font-semibold py-2 rounded-xl text-sm border border-red-900/30 transition cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ManageCafes />
    </div>
  );
}