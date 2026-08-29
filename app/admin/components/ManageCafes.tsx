'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { defaultCenter } from '@/app/lib/coordinates';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';

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
  const { user } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [description, setDescription] = useState('');
  const [priceLevel, setPriceLevel] = useState('₱ (Affordable)');
  const [vibe, setVibe] = useState('Deep Work');
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCafes, setActiveCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCafes = async () => {
    try {
      const res = await fetch('/api/admin/cafes');
      const data = await res.json();
      if (res.ok) setActiveCafes(data);
    } catch (err) {
      console.error('Failed to fetch cafes', err);
    }
  };

  useEffect(() => {
    fetchCafes();
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

  const uploadFileToSupabase = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('cafes')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      alert('Error uploading image. Is your Supabase bucket set up correctly?');
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('cafes')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFileToSupabase(file, 'cafe-covers');
      setPhoto(publicUrl);
    } catch (err) {}
  };

  const handleProductPhotoUpload = async (id: string, file: File | undefined) => {
    if (!file) return;
    try {
      const publicUrl = await uploadFileToSupabase(file, 'products');
      updateProduct(id, 'photo', publicUrl);
    } catch (err) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, photo, description, priceLevel, vibe, pinnedLocation, products, userId: user?.id })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsModalOpen(false);
        setName(''); setPhoto(''); setDescription(''); setPriceLevel('₱ (Affordable)'); setVibe('Deep Work'); setPinnedLocation(null); setProducts([]);
        fetchCafes();
      } else {
        alert(data.error || 'Failed to create cafe');
      }
    } catch (err) {
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-xl font-semibold text-white">Active Cafes</h2>
          <p className="text-sm text-zinc-400">You currently have {activeCafes.length} cafes listed.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-full transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
        >
          + Add New Cafe
        </button>
      </div>

      {/* Active Cafes List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeCafes.map(cafe => (
          <div key={cafe.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-amber-500/50 transition-colors">
            {cafe.image_url ? (
              <img src={cafe.image_url} alt={cafe.name} className="w-12 h-12 rounded-xl mb-4 object-cover" />
            ) : (
              <div className="w-12 h-12 bg-zinc-800 rounded-xl mb-4 flex items-center justify-center text-xl">☕</div>
            )}
            <h3 className="font-bold text-white mb-1">{cafe.name}</h3>
            <p className="text-sm text-zinc-400">Active • {cafe.products?.length || 0} Products</p>
          </div>
        ))}
        {activeCafes.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-2xl">
            No cafes added yet. Click "+ Add New Cafe" to get started.
          </div>
        )}
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
                      <label className="text-sm font-medium text-zinc-400">Cover Photo</label>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-zinc-950 hover:file:bg-amber-400 focus:outline-none focus:border-amber-500/50" />
                      {photo && <p className="text-xs text-green-400 font-medium">Photo uploaded successfully!</p>}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-zinc-400">Description</label>
                      <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50" placeholder="A cozy place to..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Price Level</label>
                      <select value={priceLevel} onChange={e => setPriceLevel(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 appearance-none">
                        <option value="₱ (Affordable)">₱ (Affordable)</option>
                        <option value="₱₱ (Moderate)">₱₱ (Moderate)</option>
                        <option value="₱₱₱ (Premium)">₱₱₱ (Premium)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Vibe / Atmosphere</label>
                      <select value={vibe} onChange={e => setVibe(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 appearance-none">
                        <option value="Deep Work">Deep Work</option>
                        <option value="Social Catch-up">Social Catch-up</option>
                        <option value="Quick Grab">Quick Grab</option>
                        <option value="Reading/Chill">Reading/Chill</option>
                      </select>
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
                              <input required value={product.price} onChange={e => updateProduct(product.id, 'price', e.target.value)} type="text" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none" placeholder="₱150" />
                            </div>
                            <div className="sm:col-span-6 space-y-1">
                              <label className="text-xs text-zinc-500">Photo</label>
                              <input accept="image/*" type="file" onChange={(e) => handleProductPhotoUpload(product.id, e.target.files?.[0])} className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-amber-500 file:text-zinc-950 hover:file:bg-amber-400 focus:outline-none focus:border-amber-500/50" />
                              {product.photo && <p className="text-[10px] text-green-400 mt-1 font-medium">Uploaded</p>}
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
              <button type="submit" form="add-cafe-form" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50" disabled={!pinnedLocation || loading}>
                {loading ? 'Publishing...' : 'Publish Cafe'}
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
