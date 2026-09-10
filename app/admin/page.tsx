'use client';

import { useState, useEffect } from 'react';
import ManageCafes from './components/ManageCafes';

export default function AdminPage() {
  const [pendingSuggestions, setPendingSuggestions] = useState<any[]>([]);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        // Filters items to display those pending review
        const pending = Array.isArray(data)
          ? data.filter((item: any) => item.status === 'PENDING' || item.status === 'pending' || !item.status)
          : [];
        setPendingSuggestions(pending);
      }
    } catch (err) {
      console.error('Failed to fetch menu suggestions:', err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

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

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Manage Cafes</h1>
        <p className="text-zinc-400 mt-2">Add, edit, or remove cafes and their menus.</p>
      </div>

      {pendingSuggestions.length > 0 && (
        <div className="mb-10">
          <h2 className="text-amber-500 font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            Pending Approvals ({pendingSuggestions.length})
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