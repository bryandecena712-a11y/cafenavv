'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { defaultCenter } from '@/app/lib/coordinates';

interface Product {
  id: string;
  name: string;
  price: string;
  photo: string;
  description: string;
}

export default function ManageCafes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');

  // Form State
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [description, setDescription] = useState('');
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    }
  }, []);

  const handleMapClick = (e: any) => {
    if (e.detail.latLng) {
      setPinnedLocation({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
    }
  };

  const addProduct = () => {
    setProducts([...products, { id: Date.now().toString(), name: '', price: '', photo: '', description: '' }]);
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prototyping: Just close the modal and pretend it was saved
    alert(`Cafe "${name}" with ${products.length} products has been successfully mocked/saved!`);
    setIsModalOpen(false);
    
    // Reset
    setName(''); setPhoto(''); setDescription(''); setPinnedLocation(null); setProducts([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-xl font-semibold text-white">Active Cafes</h2>
          <p className="text-sm text-zinc-400">You currently have 3 cafes listed.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-full transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
        >
          + Add New Cafe
        </button>
      </div>

      {/* Placeholder List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Brew Co.', 'Latte Art', 'Daily Grind'].map(cafe => (
          <div key={cafe} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-amber-500/50 transition-colors">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl mb-4 flex items-center justify-center text-xl">☕</div>
            <h3 className="font-bold text-white mb-1">{cafe}</h3>
            <p className="text-sm text-zinc-400">Active • 12 Products</p>
          </div>
        ))}
      </div>

      {/* Add Cafe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white tracking-tight">Add New Cafe</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="add-cafe-form" onSubmit={handleSubmit} className="space-y-10">
                
                {/* Basic Info */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">1</span>
                    Basic Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Cafe Name</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50" placeholder="e.g. Mocha Magic" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Cover Photo URL</label>
                      <input type="url" required value={photo} onChange={e => setPhoto(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50" placeholder="https://..." />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-zinc-400">Description</label>
                      <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50" placeholder="A cozy place to..." />
                    </div>
                  </div>
                </section>

                {/* Map Pinning */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">2</span>
                    Pin to Map
                  </h3>
                  <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-white/10 relative">
                    {apiKey ? (
                      <APIProvider apiKey={apiKey}>
                        <Map
                          defaultCenter={defaultCenter}
                          defaultZoom={15}
                          mapId="ADMIN_MAP_ID"
                          onClick={handleMapClick}
                          gestureHandling={'greedy'}
                          disableDefaultUI={true}
                        >
                          {pinnedLocation && (
                            <AdvancedMarker position={pinnedLocation}>
                              <div className="w-8 h-8 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
                                📍
                              </div>
                            </AdvancedMarker>
                          )}
                        </Map>
                      </APIProvider>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">Map API Key Missing</div>
                    )}
                    
                    {!pinnedLocation && (
                      <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-amber-400 pointer-events-none">
                        Click anywhere on the map to pin location
                      </div>
                    )}
                  </div>
                  {pinnedLocation && (
                    <p className="mt-2 text-xs text-zinc-400">
                      Selected: Lat {pinnedLocation.lat.toFixed(6)}, Lng {pinnedLocation.lng.toFixed(6)}
                    </p>
                  )}
                </section>

                {/* Products */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">3</span>
                      Menu Products
                    </h3>
                    <button type="button" onClick={addProduct} className="text-amber-500 text-sm font-semibold hover:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                      + Add Item
                    </button>
                  </div>
                  
                  {products.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-zinc-500 text-sm">
                      No products added yet. Click "+ Add Item" to start building the menu.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products.map((product, index) => (
                        <div key={product.id} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl relative group">
                          <button type="button" onClick={() => removeProduct(product.id)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold shadow-lg">
                            ✕
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-xs text-zinc-500">Name</label>
                              <input required value={product.name} onChange={e => updateProduct(product.id, 'name', e.target.value)} type="text" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none" placeholder="Latte" />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-xs text-zinc-500">Price</label>
                              <input required value={product.price} onChange={e => updateProduct(product.id, 'price', e.target.value)} type="text" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none" placeholder="$4.50" />
                            </div>
                            <div className="sm:col-span-6 space-y-1">
                              <label className="text-xs text-zinc-500">Photo URL</label>
                              <input required value={product.photo} onChange={e => updateProduct(product.id, 'photo', e.target.value)} type="url" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none" placeholder="https://..." />
                            </div>
                            <div className="sm:col-span-12 space-y-1">
                              <label className="text-xs text-zinc-500">Description</label>
                              <input required value={product.description} onChange={e => updateProduct(product.id, 'description', e.target.value)} type="text" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none" placeholder="A rich espresso with steamed milk..." />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 bg-zinc-900/50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-zinc-400 hover:text-white font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" form="add-cafe-form" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50" disabled={!pinnedLocation}>
                Publish Cafe
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global styles for custom scrollbar in the modal */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}
