'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Star } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

interface ReviewFormProps {
  cafeId: number;
}

export default function ReviewForm({ cafeId }: ReviewFormProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl text-center">
        <p className="text-zinc-400 mb-4">You must be logged in to leave a review.</p>
        <button 
          onClick={() => router.push('/login')}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2 rounded-full transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!content.trim()) {
      setError('Please write a review');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId, rating, content, userId: user?.id })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      // Success, refresh the page to show the new review
      setRating(0);
      setContent('');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl">
      <h3 className="text-xl font-bold text-white mb-4">Leave a Review</h3>
      
      {/* Star Rating */}
      <div className="flex gap-1 mb-4" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            className="focus:outline-none"
          >
            <Star 
              size={32} 
              weight={(hoverRating || rating) >= star ? "fill" : "regular"} 
              className={(hoverRating || rating) >= star ? "text-amber-500" : "text-zinc-600"}
            />
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What did you think of this cafe?"
        rows={4}
        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 mb-4 resize-none"
      />

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-zinc-950 font-bold px-8 py-3 rounded-full transition-colors w-full sm:w-auto"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
