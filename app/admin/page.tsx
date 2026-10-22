'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import ManageCafes from './components/ManageCafes';

export const dynamic = 'force-dynamic';

function AdminContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'pending';

  const [pendingCafes, setPendingCafes] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [discoveredCafes, setDiscoveredCafes] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<any | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    }
  }, []);

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
        if (res.ok) {
          fetchPendingCafes();
          setSelectedCafe(null);
        }
      } else {
        const res = await fetch(`/api/admin/cafes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchPendingCafes();
          setSelectedCafe(null);
        }
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

  const parseCoordinates = (loc: string) => {
    if (!loc) return null;
    const parts = String(loc).split(',').map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  };

  // Direct attribute getter functions reading exact submitted DB values
  const getDisplayPrice = (cafe: any) => {
    const raw = cafe.price_range || cafe.priceRange || cafe.price_level || cafe.priceLevel;
    if (raw && raw !== '₱' && raw !== '₱₱' && raw !== '₱₱₱') {
      return raw;
    }
    return 'Any Price';
  };

  const getDisplayEnvironment = (cafe: any) => {
    return cafe.environment || cafe.cafe_environment || cafe.cafeEnvironment || 'Both Indoor & Outdoor';
  };

  const getDisplayVibe = (cafe: any) => {
    return cafe.vibe || cafe.need_vibe || cafe.needVibe || 'Reading/Chill';
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
                      <div
                        key={cafe.id}
                        className="bg-[#191512] border border-[#2b221b] rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors"
                      >
                        <div>
                          <div className="flex gap-4 mb-3">
                            {cafe.image_url ? (
                              <img
                                src={cafe.image_url}
                                alt={cafe.name}
                                className="w-14 h-14 rounded-xl object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
                                ☕
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-white text-base leading-tight">{cafe.name}</h3>
                              <p className="text-xs text-zinc-400 mt-1">{cafe.location || 'Location pinned'}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-xs px-2 py-0.5 bg-zinc-900 border border-white/10 rounded text-amber-400 font-medium">
                              {getDisplayPrice(cafe)}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-zinc-900 border border-white/10 rounded text-amber-400 font-medium">
                              {getDisplayVibe(cafe)}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-zinc-900 border border-white/10 rounded text-amber-400 font-medium">
                              {getDisplayEnvironment(cafe)}
                            </span>
                          </div>

                          {cafe.description && (
                            <p className="text-xs text-zinc-300 italic mb-4 line-clamp-2">
                              "{cafe.description}"
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 mt-2">
                          <button
                            onClick={() => setSelectedCafe(cafe)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-white/10 font-semibold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center"
                          >
                            View Details
                          </button>

                          <div className="grid grid-cols-2 gap-2">
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

      {/* VIEW CAFE DETAILS MODAL */}
      {selectedCafe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedCafe(null)}
          />

          <div className="relative bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedCafe.name}</h2>
                <p className="text-xs text-amber-500 font-medium mt-0.5">Pending Cafe Evaluation</p>
              </div>
              <button
                onClick={() => setSelectedCafe(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Cover Photo */}
              {selectedCafe.image_url ? (
                <img
                  src={selectedCafe.image_url}
                  alt={selectedCafe.name}
                  className="w-full h-56 rounded-2xl object-cover border border-white/10"
                />
              ) : (
                <div className="w-full h-40 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-600 font-medium text-sm">
                  No Cover Photo Uploaded
                </div>
              )}

              {/* Attributes Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">PRICE RANGE</p>
                  <p className="text-xs font-bold text-amber-400 mt-1">
                    {getDisplayPrice(selectedCafe)}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">NEED / VIBE</p>
                  <p className="text-xs font-bold text-amber-400 mt-1">
                    {getDisplayVibe(selectedCafe)}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">ENVIRONMENT</p>
                  <p className="text-xs font-bold text-amber-400 mt-1">
                    {getDisplayEnvironment(selectedCafe)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-xl">
                <p className="text-xs text-zinc-400 font-semibold mb-1">Description from User:</p>
                <p className="text-sm text-zinc-200 italic">
                  "{selectedCafe.description || 'No description provided.'}"
                </p>
              </div>

              {/* Map Preview */}
              <div>
                <p className="text-xs text-zinc-400 font-semibold mb-2">Pinned Location on Map:</p>
                <div className="w-full h-[220px] rounded-xl overflow-hidden border border-white/10 relative">
                  {apiKey && parseCoordinates(selectedCafe.location) ? (
                    <APIProvider apiKey={apiKey}>
                      <Map
                        defaultCenter={parseCoordinates(selectedCafe.location)!}
                        defaultZoom={16}
                        mapId="ADMIN_EVAL_MAP_ID"
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                      >
                        <AdvancedMarker position={parseCoordinates(selectedCafe.location)!}>
                          <div className="w-8 h-8 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
                            📍
                          </div>
                        </AdvancedMarker>
                      </Map>
                    </APIProvider>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-500 text-xs">
                      {selectedCafe.location ? `Coordinates: ${selectedCafe.location}` : 'No pinned location available'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-zinc-900/50 flex justify-between items-center gap-3">
              <button
                onClick={() => setSelectedCafe(null)}
                className="px-5 py-2.5 text-zinc-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => handleCafeAction(selectedCafe.id, 'reject')}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleCafeAction(selectedCafe.id, 'approve')}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Approve & Publish
                </button>
              </div>
            </div>
          </div>
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