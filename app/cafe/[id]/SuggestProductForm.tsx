'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';

export default function SuggestProductForm({ cafeId }: { cafeId: number }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image_url: ''
  });

  if (!isAuthenticated) {
    return (
      <div className="mt-8 text-center py-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
        <h3 className="text-xl font-medium text-white mb-2">Notice a missing item?</h3>
        <p className="text-zinc-500 mb-4">Log in to suggest a new product for this cafe's menu.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-8 text-center py-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
        <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
        <h3 className="text-xl font-medium text-white mb-2">Suggestion Submitted!</h3>
        <p className="text-zinc-500">Thank you! Your suggested item will be reviewed by an admin.</p>
        <button onClick={() => { setSuccess(false); setIsOpen(false); }} className="mt-4 text-amber-500 hover:underline text-sm font-medium">
          Suggest another item
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="mt-8 text-center py-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
        <h3 className="text-xl font-medium text-white mb-2">Notice a missing item?</h3>
        <p className="text-zinc-500 mb-4">Help us keep the menu up to date!</p>
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-amber-500 text-zinc-950 font-medium px-6 py-2 rounded-full hover:bg-amber-400 transition-colors"
        >
          Suggest a Menu Item
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`/api/cafes/${cafeId}/products/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', price: '', description: '', image_url: '' });
      } else {
        alert('Failed to suggest product. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-zinc-900 border border-white/5 rounded-3xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-white">Suggest a Menu Item</h3>
        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Product Name *</label>
          <input 
            required
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
            placeholder="e.g. Iced Vanilla Latte"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Price *</label>
          <input 
            required
            type="text" 
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
            placeholder="e.g. ₱180"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
          <textarea 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white resize-none h-24"
            placeholder="Optional details..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Image URL</label>
          <input 
            type="text" 
            value={formData.image_url}
            onChange={e => setFormData({...formData, image_url: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <button 
          disabled={isSubmitting}
          type="submit" 
          className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-2"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}
