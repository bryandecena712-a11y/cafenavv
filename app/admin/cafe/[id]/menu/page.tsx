'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

export default function ManageMenuPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const cafeId = parseInt(params.id, 10);
  
  const [cafe, setCafe] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      // We can fetch the specific cafe's products. For simplicity, we just use the existing API if possible.
      // Wait, we don't have a specific API for fetching ONE cafe in admin. 
      // Let's just fetch all and find it, or build a quick GET in admin.
      // Actually, since we're Client Side, we can fetch from /api/cafes?id=... if it supported it.
      // We'll just fetch all active cafes for now.
      const res = await fetch('/api/admin/cafes');
      const data = await res.json();
      const found = data.find((c: any) => c.id === cafeId);
      if (found) {
        setCafe(found);
        setProducts(found.products || []);
      }
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
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
    setIsSubmitting(true);
    try {
      let image_url = '';
      if (imageFile) {
        image_url = await handleUpload(imageFile);
      }
      
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId, name, price, description, image_url })
      });
      
      if (res.ok) {
        setName(''); setPrice(''); setDescription(''); setImageFile(null);
        fetchData();
      }
    } catch (err) {
      alert('Failed to add product');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchData();
    } catch (err) {}
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!cafe) return <div className="p-8 text-white">Cafe not found</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-amber-500 hover:underline mb-2 inline-block">← Back to Admin</Link>
          <h1 className="text-3xl font-bold text-white">Manage Menu: {cafe.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Add Product Form */}
        <div className="md:col-span-1 bg-zinc-900 border border-white/5 p-6 rounded-2xl h-fit">
          <h2 className="text-xl font-bold text-white mb-4">Add Item</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Name *</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Price *</label>
              <input required value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. ₱150" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Photo</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-sm text-zinc-400" />
            </div>
            <button disabled={isSubmitting} className="w-full bg-amber-500 text-zinc-950 font-bold py-2 rounded-xl">
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </button>
          </form>
        </div>

        {/* Existing Products */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Current Menu ({products.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex gap-4 relative group">
                <button onClick={() => handleDelete(product.id)} className="absolute top-2 right-2 w-6 h-6 bg-rose-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                <div className="w-16 h-16 bg-zinc-800 rounded-xl flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">☕</div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white">{product.name}</h3>
                  <p className="text-amber-500 text-sm font-semibold mb-1">{product.price}</p>
                  <p className="text-xs text-zinc-400 line-clamp-2">{product.description}</p>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-zinc-500 col-span-full">No products added yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
