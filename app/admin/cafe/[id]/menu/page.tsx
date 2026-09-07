'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

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

  // Edit states
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

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

  if (loading) return <div className="p-8 text-white">Loading menu manager...</div>;
  if (!cafe) return <div className="p-8 text-white">Cafe not found.</div>;

  const approvedProducts = products.filter(p => p.status === 'APPROVED' || !p.status);
  const pendingProducts = products.filter(p => p.status === 'PENDING');

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-amber-500 hover:underline mb-2 inline-block">← Back to Admin</Link>
          <h1 className="text-3xl font-bold">{cafe.name} - Manage Menu</h1>
        </div>
      </div>

      {/* Pending User Suggestions */}
      {pendingProducts.length > 0 && (
        <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Pending User Suggestions ({pendingProducts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingProducts.map(product => (
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
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Price *</label>
              <input required value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 150" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Photo</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-sm text-zinc-400" />
            </div>
            <button disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 rounded-xl transition-colors">
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </button>
          </form>
        </div>

        {/* Current Approved Menu */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Current Menu ({approvedProducts.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {approvedProducts.map(product => (
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

                  {/* Actions: Edit & Delete Buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => handleStartEdit(product)} className="bg-zinc-800 hover:bg-zinc-700 text-amber-500 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/5 transition-colors">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-500/20 transition-colors">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Edit Menu Item</h3>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name</label>
                <input required value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Price</label>
                <input required value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Update Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={e => setEditImageFile(e.target.files?.[0] || null)} className="text-sm text-zinc-400" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700">Cancel</button>
                <button disabled={isSubmitting} type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl">
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