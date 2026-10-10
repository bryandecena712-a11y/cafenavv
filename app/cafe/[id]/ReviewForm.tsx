'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Star } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

interface ReviewFormProps {
  cafeId: number;
}

export default function ReviewForm({ cafeId }: ReviewFormProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl text-center">
        <p className="text-zinc-400 mb-4">You must be logged in to leave a review.</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2 rounded-full transition-colors cursor-pointer"
        >
          Log In
        </button>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const uploadReviewPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `reviews/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('cafes').upload(fileName, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('cafes').getPublicUrl(fileName);
    return data.publicUrl;
  };

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
      let uploadedImageUrl = '';
      if (imageFile) {
        uploadedImageUrl = await uploadReviewPhoto(imageFile);
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId,
          rating,
          content: content.trim(),
          userId: user?.id,
          image_url: uploadedImageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      if (res.status === 202) {
        setError('Review saved offline. It will sync when you reconnect.');
      }

      // Reset form and refresh details
      setRating(0);
      setContent('');
      setImageFile(null);
      setPreviewUrl(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
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
            className="focus:outline-none cursor-pointer"
          >
            <Star
              size={32}
              weight={(hoverRating || rating) >= star ? 'fill' : 'regular'}
              className={(hoverRating || rating) >= star ? 'text-amber-500' : 'text-zinc-600'}
            />
          </button>
        ))}
      </div>

      {/* Review Text */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What did you think of this cafe?"
        rows={4}
        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 mb-4 resize-none text-sm"
      />

      {/* Photo Attachment Input */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Attach Photo (Optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-amber-500 hover:file:bg-zinc-700 cursor-pointer"
        />

        {/* Image Preview */}
        {previewUrl && (
          <div className="mt-3 relative w-full h-36 bg-zinc-950 rounded-xl overflow-hidden border border-amber-500/30">
            <img src={previewUrl} alt="Review attachment preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-2 right-2 bg-zinc-950/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-rose-500 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-zinc-950 font-bold px-8 py-3 rounded-full transition-colors w-full sm:w-auto cursor-pointer"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}