'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function SuggestPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [suggestionType, setSuggestionType] = useState<'cafe' | 'product'>('cafe');
  const [cafes, setCafes] = useState<any[]>([]);

  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  const [cafeFormData, setCafeFormData] = useState({
    name: '',
    location: '',
    description: '',
    price_level: '₱₱',
    vibe: 'chill',
    image_url: ''
  });

  const [productFormData, setProductFormData] = useState({
    cafeId: '',
    name: '',
    price: '',
    description: '',
    image_url: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const res = await fetch('/api/cafes');
        if (res.ok) {
          const data = await res.json();
          setCafes(data);
          if (data.length > 0) {
            setProductFormData((prev) => ({ ...prev, cafeId: data[0].id.toString() }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch cafes:', err);
      }
    };

    fetchCafes();
  }, []);

  const handleAutoFill = async () => {
    if (!scrapeUrl) {
      alert('Please enter a valid link first.');
      return;
    }

    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        if (suggestionType === 'cafe') {
          setCafeFormData((prev) => ({
            ...prev,
            name: data.title ? data.title.split('|')[0].split('-')[0].trim() : prev.name,
            description: data.description || prev.description,
            image_url: data.image_url || prev.image_url,
          }));
        } else {
          setProductFormData((prev) => ({
            ...prev,
            name: data.title ? data.title.split('|')[0].split('-')[0].trim() : prev.name,
            description: data.description || prev.description,
            image_url: data.image_url || prev.image_url,
          }));
        }
        alert('Details auto-filled successfully!');
      } else {
        alert(data.error || 'Failed to auto-fill details from this link.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to scraper service.');
    } finally {
      setIsScraping(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white relative">
        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-full text-sm hover:bg-amber-400 transition-colors shadow-md"
          >
            ← Back to Home
          </Link>
        </div>

        <span className="text-4xl mb-4">🔒</span>
        <h1 className="text-2xl font-bold mb-2">Login Required</h1>
        <p className="text-zinc-400 mb-6">You must be logged in to make suggestions.</p>
        <button onClick={() => router.push('/login')} className="bg-amber-500 text-zinc-950 font-medium px-6 py-2 rounded-full hover:bg-amber-400 transition-colors cursor-pointer">
          Go to Login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let endpoint = '';
      let payload = {};

      if (suggestionType === 'cafe') {
        if (!cafeFormData.name.trim() || !cafeFormData.location.trim()) {
          alert('Please fill in both Cafe Name and Location.');
          setIsSubmitting(false);
          return;
        }

        endpoint = '/api/cafes';
        payload = {
          name: cafeFormData.name.trim(),
          location: cafeFormData.location.trim(),
          description: cafeFormData.description.trim() || 'No description provided',
          price_level: cafeFormData.price_level || '₱₱',
          vibe: cafeFormData.vibe || 'chill',
          image_url: cafeFormData.image_url.trim() || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
          status: 'PENDING'
        };
      } else {
        if (!productFormData.cafeId || !productFormData.name.trim() || !productFormData.price) {
          alert('Please select a cafe and fill in the item name and price.');
          setIsSubmitting(false);
          return;
        }

        endpoint = '/api/admin/products';
        payload = {
          cafeId: productFormData.cafeId,
          name: productFormData.name.trim(),
          price: parseFloat(productFormData.price) || 0,
          description: productFormData.description.trim() || 'No description provided',
          image_url: productFormData.image_url.trim() || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
          status: 'PENDING'
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(true);
        setCafeFormData({ name: '', location: '', description: '', price_level: '₱₱', vibe: 'chill', image_url: '' });
        setProductFormData({ cafeId: cafes[0]?.id?.toString() || '', name: '', price: '', description: '', image_url: '' });
        setScrapeUrl('');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || errorData.message || 'Failed to submit suggestion.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-6 text-center relative">
        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-full text-sm hover:bg-amber-400 transition-colors shadow-md"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6">
          ✓
        </div>
        <h1 className="text-3xl font-bold mb-4">Thanks for the suggestion!</h1>
        <p className="text-zinc-400 max-w-md mb-8">
          Your submission has been received and routed to our admin queue for real-time review!
        </p>
        <button 
          onClick={() => setSuccess(false)} 
          className="bg-amber-500 text-zinc-950 font-medium px-8 py-3 rounded-full hover:bg-amber-400 transition-colors cursor-pointer"
        >
          Suggest Another Item
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-12 px-6 relative">
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-full text-sm hover:bg-amber-400 transition-colors shadow-md"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Suggest a Cafe or Menu Item</h1>
        <p className="text-zinc-400 mb-6">Help us update CafeNav by suggesting a new item for review.</p>

        {/* Auto-fill web scraping widget */}
        <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-semibold text-amber-400 mb-2">
            ✨ Auto-Fill details from web link
          </label>
          <div className="flex gap-2">
            <input 
              type="url"
              placeholder="Paste a website or social URL..."
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={isScraping}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isScraping ? 'Scraping...' : 'Auto-Fill'}
            </button>
          </div>
        </div>

        <div className="flex bg-zinc-900 border border-white/5 rounded-xl p-1 mb-8">
          <button
            type="button"
            onClick={() => setSuggestionType('cafe')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              suggestionType === 'cafe' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Suggest Cafe
          </button>
          <button
            type="button"
            onClick={() => setSuggestionType('product')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              suggestionType === 'product' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Suggest Menu Item
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/5 rounded-2xl p-8 space-y-6">
          {suggestionType === 'cafe' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Cafe Name *</label>
                <input 
                  required
                  type="text" 
                  value={cafeFormData.name}
                  onChange={e => setCafeFormData({...cafeFormData, name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
                  placeholder="e.g. Starbucks"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Location / City *</label>
                <input 
                  required
                  type="text" 
                  value={cafeFormData.location}
                  onChange={e => setCafeFormData({...cafeFormData, location: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
                  placeholder="e.g. Manila"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <textarea 
                  value={cafeFormData.description}
                  onChange={e => setCafeFormData({...cafeFormData, description: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white h-24 resize-none"
                  placeholder="What makes this place special?"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Price Level</label>
                  <select 
                    value={cafeFormData.price_level}
                    onChange={e => setCafeFormData({...cafeFormData, price_level: e.target.value})}
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
                    value={cafeFormData.vibe}
                    onChange={e => setCafeFormData({...cafeFormData, vibe: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white appearance-none"
                  >
                    <option value="chill">Chill</option>
                    <option value="focused">Focused</option>
                    <option value="social">Social</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Image URL</label>
                <input 
                  type="text" 
                  value={cafeFormData.image_url}
                  onChange={e => setCafeFormData({...cafeFormData, image_url: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Select Cafe *</label>
                <select 
                  required
                  value={productFormData.cafeId}
                  onChange={e => setProductFormData({...productFormData, cafeId: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white appearance-none"
                >
                  {cafes.map((cafe) => (
                    <option key={cafe.id} value={cafe.id}>
                      {cafe.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Menu Item Name *</label>
                <input 
                  required
                  type="text" 
                  value={productFormData.name}
                  onChange={e => setProductFormData({...productFormData, name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
                  placeholder="e.g. Spanish Latte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Price (₱) *</label>
                <input 
                  required
                  type="number" 
                  value={productFormData.price}
                  onChange={e => setProductFormData({...productFormData, price: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
                  placeholder="150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <textarea 
                  value={productFormData.description}
                  onChange={e => setProductFormData({...productFormData, description: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white h-24 resize-none"
                  placeholder="Describe ingredients or size"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Image URL</label>
                <input 
                  type="text" 
                  value={productFormData.image_url}
                  onChange={e => setProductFormData({...productFormData, image_url: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
                  placeholder="https://example.com/item.jpg"
                />
              </div>
            </>
          )}

          <button 
            disabled={isSubmitting}
            type="submit" 
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-4 cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : `Submit ${suggestionType === 'cafe' ? 'Cafe' : 'Menu Item'} Suggestion`}
          </button>
        </form>
      </div>
    </div>
  );
}