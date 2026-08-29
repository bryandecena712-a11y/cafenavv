'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function SuggestCafePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    price_level: '₱₱',
    vibe: 'chill',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <span className="text-4xl mb-4">🔒</span>
        <h1 className="text-2xl font-bold mb-2">Login Required</h1>
        <p className="text-zinc-400 mb-6">You must be logged in to suggest a cafe.</p>
        <button onClick={() => router.push('/login')} className="bg-amber-500 text-zinc-950 font-medium px-6 py-2 rounded-full hover:bg-amber-400 transition-colors">
          Go to Login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/cafes/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', location: '', description: '', price_level: '₱₱', vibe: 'chill', image_url: '' });
      } else {
        alert('Failed to suggest cafe. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6">
          ✓
        </div>
        <h1 className="text-3xl font-bold mb-4">Thanks for the suggestion!</h1>
        <p className="text-zinc-400 max-w-md mb-8">
          Your cafe suggestion has been submitted. Our team will review it shortly. Once approved, it will appear on the map!
        </p>
        <button onClick={() => router.push('/')} className="bg-amber-500 text-zinc-950 font-medium px-8 py-3 rounded-full hover:bg-amber-400 transition-colors">
          Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Suggest a Cafe</h1>
        <p className="text-zinc-400 mb-8">Know a great spot that we missed? Fill out the details below and we'll add it to CafeNav.</p>
        
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/5 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Cafe Name *</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
              placeholder="e.g. Brew & Co."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Location/Address *</label>
            <input 
              required
              type="text" 
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
              placeholder="e.g. 12.345, 67.890 or 123 Main St"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white h-24 resize-none"
              placeholder="What makes this place special?"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Price Level</label>
              <select 
                value={formData.price_level}
                onChange={e => setFormData({...formData, price_level: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white appearance-none"
              >
                <option value="₱">₱ (Affordable)</option>
                <option value="₱₱">₱₱ (Moderate)</option>
                <option value="₱₱₱">₱₱₱ (Premium)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Vibe</label>
              <select 
                value={formData.vibe}
                onChange={e => setFormData({...formData, vibe: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white appearance-none"
              >
                <option value="chill">Chill</option>
                <option value="focused">Focused</option>
                <option value="social">Social</option>
                <option value="aesthetic">Aesthetic</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Image URL</label>
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
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-4"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      </div>
    </div>
  );
}
