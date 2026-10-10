'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

const DEFAULT_SERVICES = ['Dine-in', 'Delivery', 'Takeout'];
const DEFAULT_OFFERINGS = ['Coffee', 'Non-Coffee', 'Quick Bites', 'Pastries', 'Desserts'];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE: Record<string, { open: string; close: string; isClosed: boolean }> = {
  Monday: { open: '09:00', close: '23:00', isClosed: false },
  Tuesday: { open: '09:00', close: '23:00', isClosed: false },
  Wednesday: { open: '09:00', close: '23:00', isClosed: false },
  Thursday: { open: '09:00', close: '23:00', isClosed: false },
  Friday: { open: '09:00', close: '01:00', isClosed: false },
  Saturday: { open: '09:00', close: '01:00', isClosed: false },
  Sunday: { open: '09:00', close: '01:00', isClosed: false },
};

export default function ManageMenuPage() {
  const params = useParams();
  const rawId = params?.id;
  const cafeId = rawId ? parseInt(Array.isArray(rawId) ? rawId[0] : rawId, 10) : null;

  const [cafe, setCafe] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for NEW product
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Edit states for products
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  // Operating Schedule State
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hoursSavedSuccess, setHoursSavedSuccess] = useState(false);

  // Cafe Details Form States
  const [services, setServices] = useState<string[]>([]);
  const [offerings, setOfferings] = useState<string[]>([]);
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [website, setWebsite] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsSavedSuccess, setDetailsSavedSuccess] = useState(false);

  // Custom Tag Input States
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [customOfferingInput, setCustomOfferingInput] = useState('');

  const fetchData = async () => {
    if (!cafeId) return;
    try {
      const res = await fetch('/api/admin/cafes');
      const data = await res.json();
      if (Array.isArray(data)) {
        const found = data.find((c: any) => c.id === cafeId);
        if (found) {
          setCafe(found);
          setProducts(found.products || []);

          setFacebook(found.facebook_url || '');
          setInstagram(found.instagram_url || '');
          setTiktok(found.tiktok_url || '');
          setWebsite(found.website_url || '');

          if (found.operating_hours) {
            try {
              const parsed = typeof found.operating_hours === 'string' ? JSON.parse(found.operating_hours) : found.operating_hours;
              setSchedule({ ...DEFAULT_SCHEDULE, ...parsed });
            } catch {
              setSchedule(DEFAULT_SCHEDULE);
            }
          }

          if (found.service_options) {
            try {
              const parsed = typeof found.service_options === 'string' ? JSON.parse(found.service_options) : found.service_options;
              setServices(Array.isArray(parsed) ? parsed : [String(parsed)]);
            } catch {
              setServices(found.service_options.split(',').map((s: string) => s.trim()).filter(Boolean));
            }
          }

          if (found.offerings) {
            try {
              const parsed = typeof found.offerings === 'string' ? JSON.parse(found.offerings) : found.offerings;
              setOfferings(Array.isArray(parsed) ? parsed : [String(parsed)]);
            } catch {
              setOfferings(found.offerings.split(',').map((s: string) => s.trim()).filter(Boolean));
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch cafe data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (cafeId) {
      fetchData();
    }
  }, [cafeId]);

  const handleUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;
    const { error } = await supabase.storage.from('cafes').upload(filePath, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('cafes').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    setIsSubmitting(true);
    try {
      let image_url = '';
      if (imageFile) image_url = await handleUpload(imageFile);

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId, name, price, description, image_url }),
      });

      if (res.ok) {
        const newProduct = await res.json();
        await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: newProduct.id, status: 'APPROVED' }),
        });
        setName(''); setPrice(''); setDescription(''); setImageFile(null);
        fetchData();
      }
    } catch (err) {
      alert('Failed to add product');
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (product: any) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price);
    setEditDescription(product.description || '');
    setEditImageFile(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      let image_url = editingProduct.image_url;
      if (editImageFile) {
        image_url = await handleUpload(editImageFile);
      }

      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          name: editName,
          price: editPrice,
          description: editDescription,
          image_url,
        }),
      });

      if (res.ok) {
        setEditingProduct(null);
        fetchData();
      }
    } catch (err) {
      alert('Failed to update product');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'APPROVED' }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to approve product:', err);
    }
  };

  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const addCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices([...services, trimmed]);
      setCustomServiceInput('');
    }
  };

  const addCustomOffering = () => {
    const trimmed = customOfferingInput.trim();
    if (trimmed && !offerings.includes(trimmed)) {
      setOfferings([...offerings, trimmed]);
      setCustomOfferingInput('');
    }
  };

  const deleteServiceTag = (item: string) => {
    setServices(services.filter((s) => s !== item));
  };

  const deleteOfferingTag = (item: string) => {
    setOfferings(offerings.filter((o) => o !== item));
  };

  const handleScheduleChange = (day: string, field: 'open' | 'close' | 'isClosed', value: any) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    setIsSavingHours(true);
    setHoursSavedSuccess(false);

    try {
      const res = await fetch(`/api/admin/cafes/${cafeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operating_hours: JSON.stringify(schedule) }),
      });

      if (res.ok) {
        setHoursSavedSuccess(true);
        setTimeout(() => setHoursSavedSuccess(false), 3000);
        fetchData();
      } else {
        alert('Failed to update operating hours');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating operating hours');
    } finally {
      setIsSavingHours(false);
    }
  };

  const handleSaveCafeDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    setIsSavingDetails(true);
    setDetailsSavedSuccess(false);

    try {
      const res = await fetch(`/api/admin/cafes/${cafeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_options: JSON.stringify(services),
          offerings: JSON.stringify(offerings),
          facebook_url: facebook,
          instagram_url: instagram,
          tiktok_url: tiktok,
          website_url: website,
        }),
      });

      if (res.ok) {
        setDetailsSavedSuccess(true);
        setTimeout(() => setDetailsSavedSuccess(false), 3000);
        fetchData();
      } else {
        alert('Failed to update cafe details');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred saving cafe details');
    } finally {
      setIsSavingDetails(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading menu manager...</div>;
  if (!cafe) return <div className="p-8 text-white">Cafe not found.</div>;

  const approvedProducts = products.filter((p) => p.status === 'APPROVED' || !p.status);
  const pendingProducts = products.filter((p) => p.status === 'PENDING');

  const allServiceOptions = Array.from(new Set([...DEFAULT_SERVICES, ...services]));
  const allOfferingOptions = Array.from(new Set([...DEFAULT_OFFERINGS, ...offerings]));

  return (
    <div className="p-8 max-w-6xl mx-auto text-white space-y-12">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-full text-sm hover:bg-amber-400 transition-colors mb-4 shadow-md"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">{cafe.name} - Manage Menu</h1>
      </div>

      {/* Pending User Suggestions */}
      {pendingProducts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Pending User Suggestions ({pendingProducts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingProducts.map((product) => (
              <div key={product.id} className="bg-zinc-950/80 border border-amber-500/20 rounded-2xl p-4 flex gap-4 relative group">
                <button onClick={() => handleDelete(product.id)} className="absolute top-2 right-2 w-6 h-6 bg-rose-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                <div className="w-16 h-16 bg-zinc-800 rounded-xl flex-shrink-0 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">☕</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">{product.name}</h3>
                  <p className="text-amber-500 text-sm font-semibold mb-1">₱{product.price}</p>
                  <p className="text-xs text-zinc-400 line-clamp-1 mb-2">{product.description}</p>
                  <button onClick={() => handleApprove(product.id)} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                    Approve Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Add Product & Current Approved Menu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Add Product Form */}
        <div className="md:col-span-1 bg-zinc-900 border border-white/5 p-6 rounded-2xl h-fit">
          <h2 className="text-xl font-bold mb-4">Add Item</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Name *</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Price *</label>
              <input required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 150" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="text-sm text-zinc-400" />
            </div>
            <button disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 rounded-xl transition-colors cursor-pointer">
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </button>
          </form>
        </div>

        {/* Current Approved Menu */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Current Menu ({approvedProducts.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {approvedProducts.map((product) => (
              <div key={product.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex gap-4 relative group">
                <div className="w-20 h-20 bg-zinc-800 rounded-xl flex-shrink-0 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">☕</div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white text-base">{product.name}</h3>
                      <span className="text-amber-500 text-sm font-bold">₱{product.price}</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{product.description || 'No description'}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => handleStartEdit(product)} className="bg-zinc-800 hover:bg-zinc-700 text-amber-500 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/5 transition-colors cursor-pointer">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-500/20 transition-colors cursor-pointer">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manage Operating Hours */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🕒</span> Manage Operating Hours
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Set real-time opening & closing times for Monday to Sunday.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveHours} className="space-y-4">
          <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/60">
            {DAYS_OF_WEEK.map((day) => {
              const item = schedule[day] || { open: '09:00', close: '23:00', isClosed: false };
              return (
                <div key={day} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="w-32 font-semibold text-sm text-zinc-200">{day}</div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isClosed}
                        onChange={(e) => handleScheduleChange(day, 'isClosed', e.target.checked)}
                        className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-900"
                      />
                      Mark as Closed
                    </label>

                    {!item.isClosed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={item.open}
                          onChange={(e) => handleScheduleChange(day, 'open', e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                        <span className="text-zinc-500 text-xs">to</span>
                        <input
                          type="time"
                          value={item.close}
                          onChange={(e) => handleScheduleChange(day, 'close', e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSavingHours}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingHours ? 'Saving Schedule...' : 'Save Operating Hours'}
            </button>
            {hoursSavedSuccess && (
              <span className="text-xs text-emerald-500 font-semibold">✓ Schedule updated successfully!</span>
            )}
          </div>
        </form>
      </div>

      {/* Dynamic Section: Manage Details */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-white">
          {cafe.name} - Manage Details
        </h2>

        <form onSubmit={handleSaveCafeDetails} className="space-y-6">
          {/* Service Options with Add/Delete CRUD */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Service Options</label>
            <div className="flex flex-wrap gap-2.5 mb-3">
              {allServiceOptions.map((item) => {
                const isSelected = services.includes(item);
                const isCustom = !DEFAULT_SERVICES.includes(item);
                return (
                  <div key={item} className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleItem(services, setServices, item)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {item}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => deleteServiceTag(item)}
                        className="text-zinc-500 hover:text-rose-400 text-xs px-1 cursor-pointer"
                        title="Remove custom option"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Service Input */}
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Add custom option (e.g., Outdoor Seating)..."
                value={customServiceInput}
                onChange={(e) => setCustomServiceInput(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500 flex-1"
              />
              <button
                type="button"
                onClick={addCustomService}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/5 cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Offerings Options with Add/Delete CRUD */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Offerings</label>
            <div className="flex flex-wrap gap-2.5 mb-3">
              {allOfferingOptions.map((item) => {
                const isSelected = offerings.includes(item);
                const isCustom = !DEFAULT_OFFERINGS.includes(item);
                return (
                  <div key={item} className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleItem(offerings, setOfferings, item)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {item}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => deleteOfferingTag(item)}
                        className="text-zinc-500 hover:text-rose-400 text-xs px-1 cursor-pointer"
                        title="Remove custom offering"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Offering Input */}
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Add custom offering (e.g., Matcha, Pasta)..."
                value={customOfferingInput}
                onChange={(e) => setCustomOfferingInput(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500 flex-1"
              />
              <button
                type="button"
                onClick={addCustomOffering}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/5 cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Facebook URL</label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/cafe"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Instagram URL</label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/cafe"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">TikTok URL</label>
              <input
                type="url"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="https://tiktok.com/@cafe"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Website URL</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://cafe.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSavingDetails}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingDetails ? 'Saving...' : 'Save Details'}
            </button>
            {detailsSavedSuccess && (
              <span className="text-xs text-emerald-500 font-semibold">✓ Details saved successfully!</span>
            )}
          </div>
        </form>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Edit Menu Item</h3>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name</label>
                <input required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Price</label>
                <input required value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Update Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} className="text-sm text-zinc-400" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 cursor-pointer">Cancel</button>
                <button disabled={isSubmitting} type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl cursor-pointer">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}