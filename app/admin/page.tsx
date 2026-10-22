'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ManageCafes from './components/ManageCafes';

export const dynamic = 'force-dynamic';

function AdminContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'pending';

  const [pendingCafes, setPendingCafes] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [discoveredCafes, setDiscoveredCafes] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Fetch all pending cafe suggestions
  const fetchPendingCafes = async () => {
    try {
      const res = await fetch('/api/admin/cafes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPendingCafes(data.filter((c: any) => c.status === 'PENDING'));
        }
      }
    } catch (err) {
      console.error('Failed to fetch pending cafes:', err);
    }
  };

  // Fetch all pending menu item suggestions
  const fetchPendingProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPendingProducts(
            data.filter(
              (p: any) => p.status === 'PENDING' || p.status === 'pending' || !p.status
            )
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch pending products:', err);
    }
  };

  // Fetch discovered OSM cafes
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

  // Initial load + 5-second interval for real-time updates
  useEffect(() => {
    fetchPendingCafes();
    fetchPendingProducts();
    fetchDiscovered();

    const interval = setInterval(() => {
      fetchPendingCafes();
      fetchPendingProducts();
      fetchDiscovered();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle Cafe Approvals & Rejections
  const handleCafeAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        const res = await fetch(`/api/admin/cafes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        });
        if (res.ok) fetchPendingCafes();
      } else {
        const res = await fetch(`/api/admin/cafes/${id}`, { method: 'DELETE' });
        if (res.ok) fetchPendingCafes();
      }
    } catch (err) {
      console.error('Failed to update cafe status:', err);
    }
  };

  // Handle Product Approvals & Rejections
  const handleProductAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        const res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'APPROVED' }),
        });
        if (res.ok) fetchPendingProducts();
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (res.ok) fetchPendingProducts();
      }
    } catch (err) {
      console.error('Failed to update product status:', err);
    }
  };

  // Handle Discovered OSM Cafes
  const handleDiscoveredAction = async (id: number, action: 'APPROVE' | 'DISMISS') => {
    try {
      const res = await fetch('/api/admin/discovered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });

      if (res.ok) {
        setDiscoveredCafes((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to update discovered cafe:', err);
    }
  };

  const handleScanOSM = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/admin/discover-osm', { method: 'POST' });
      const data = await res.json();
      alert(data.message || data.error);
      fetchDiscovered();
    } catch (err) {
      alert('Failed to connect to OpenStreetMap sync service');
    } finally {
      setIsScanning(false);
    }
  };

  const totalPending = pendingCafes.length + pendingProducts.length;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* 1. PENDING APPROVALS VIEW */}
      {tabParam === 'pending' && (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Pending Approvals</h1>
            <p className="text-zinc-400 mt-2">
              Review user-submitted cafes and menu items before publishing them live.
            </p>
          </div>

          {totalPending === 0 ? (
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12 text-center text-zinc-500">
              🎉 No pending approvals right now!
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pending Cafes Section */}
              {pendingCafes.length > 0 && (
                <div>
                  <h2 className="text-amber-500 font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Pending Cafe Submissions ({pendingCafes.length})
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingCafes.map((cafe) => (
                      <div key={cafe.id} className="bg-[#191512] border border-[#2b221b] rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex gap-4 mb-3">
                            {cafe.image_url ? (
                              <img src={cafe.image_url} alt={cafe.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                            ) : (
                              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-2xl shrink-0">☕</div>
                            )}
                            <div>
                              <h3 className="font-bold text-white text-base leading-tight">{cafe.name}</h3>
                              <p className="text-xs text-zinc-400 mt-1">{cafe.location || 'Location pinned'}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-xs px-2 py-0.5 bg-zinc-900 border border-white/10 rounded text-amber-400 font-medium">
                              {cafe.price_range || cafe.price_level || '₱100-300'}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-zinc-900 border border-white/10 rounded text-amber-400 font-medium">
                              {cafe.vibe || 'Reading/Chill'}
                            </span>
                            {cafe.environment && (
                              <span className="text-xs px-2 py-0.5 bg-zinc-900 border border-white/10 rounded text-amber-400 font-medium">
                                {cafe.environment}
                              </span>
                            )}
                          </div>

                          {cafe.description && (
                            <p className="text-xs text-zinc-300 italic mb-4">"{cafe.description}"</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button
                            onClick={() => handleCafeAction(cafe.id, 'approve')}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 rounded-xl text-sm transition cursor-pointer border-none"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleCafeAction(cafe.id, 'reject')}
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

              {/* Pending Products Section */}
              {pendingProducts.length > 0 && (
                <div>
                  <h2 className="text-amber-500 font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Pending Menu Item Suggestions ({pendingProducts.length})
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingProducts.map((item) => (
                      <div key={item.id} className="bg-[#191512] border border-[#2b221b] rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start gap-3 mb-3">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-neutral-800 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-xs text-neutral-500 shrink-0">No image</div>
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
                            <p className="text-neutral-400 text-xs italic mb-4">"{item.description}"</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button
                            onClick={() => handleProductAction(item.id, 'approve')}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 rounded-xl text-sm transition cursor-pointer border-none"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProductAction(item.id, 'reject')}
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
            </div>
          )}
        </div>
      )}

      {/* 2. MANAGE CAFES VIEW */}
      {tabParam === 'manage' && (
        <div>
          <ManageCafes />
        </div>
      )}

      {/* 3. DISCOVERED VIEW */}
      {tabParam === 'discovered' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Discovered Cafes</h1>
              <p className="text-zinc-400 mt-2">
                Cafes discovered via OpenStreetMap awaiting review and verification.
              </p>
            </div>

            <button
              onClick={handleScanOSM}
              disabled={isScanning}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-5 py-3 rounded-xl transition cursor-pointer disabled:opacity-50 border-none flex items-center justify-center gap-2 self-start sm:self-auto shadow-lg"
            >
              {isScanning ? 'Scanning OpenStreetMap...' : '🔄 Scan OpenStreetMap Now'}
            </button>
          </div>

          {discoveredCafes.length === 0 ? (
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12 text-center text-zinc-500">
              No new discovered cafes found. Click "Scan OpenStreetMap Now" to scan for new spots!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discoveredCafes.map((item) => (
                <div key={item.id} className="bg-[#191512] border border-[#2b221b] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg shrink-0">
                        ☕
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">{item.name}</h3>
                        <p className="text-neutral-400 text-xs mt-1">
                          Location: <span className="text-amber-500 font-medium">{item.location}</span>
                        </p>
                      </div>
                    </div>

                    <p className="text-neutral-400 text-xs italic mb-4">Source: {item.source || 'OpenStreetMap'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      onClick={() => handleDiscoveredAction(item.id, 'APPROVE')}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 rounded-xl text-sm transition cursor-pointer border-none"
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
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400">Loading Admin Dashboard...</div>}>
      <AdminContent />
    </Suspense>
  );
}