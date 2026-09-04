'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function CafeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const cafeId = parseInt(resolvedParams.id, 10);
  const { user } = useAuth();

  const [cafe, setCafe] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchCafeData = async () => {
    try {
      const res = await fetch(`/api/cafes/${cafeId}`);
      if (res.ok) {
        const data = await res.json();
        setCafe(data);
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load cafe details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cafeId) {
      fetchCafeData();
    }
  }, [cafeId]);

  // Handle Review Submission
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please log in to submit a review.');
    setIsSubmittingReview(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId,
          rating,
          content: reviewContent,
          userId: user.id,
        }),
      });

      if (res.ok) {
        setReviewContent('');
        fetchCafeData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to post review');
      }
    } catch (err) {
      console.error('Review submit error:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Review Deletion
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete your review?')) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          userId: user?.id,
        }),
      });

      if (res.ok) {
        fetchCafeData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete review');
      }
    } catch (err) {
      console.error('Delete review error:', err);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading cafe details...</div>;
  if (!cafe) return <div className="p-8 text-white">Cafe not found.</div>;

  const hasAlreadyReviewed = user && reviews.some((r) => r.user_id === user.id || r.userId === user.id);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-white">
      <Link href="/" className="text-amber-500 hover:underline inline-block">
        ← Back to Map
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {cafe.image_url && (
          <img
            src={cafe.image_url}
            alt={cafe.name}
            className="w-full md:w-80 h-52 object-cover rounded-3xl border border-white/10"
          />
        )}
        <div>
          <h1 className="text-4xl font-bold">{cafe.name}</h1>
          <p className="text-zinc-400 mt-2">{cafe.description}</p>
          <p className="text-amber-500 font-semibold mt-4">📍 {cafe.location}</p>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/10">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-amber-500">★</span> Community Reviews
          </h2>

          {reviews.map((rev) => {
            // Checks if the review belongs to the currently logged-in user
            const isMyReview = user && (rev.user_id === user.id || rev.userId === user.id);

            return (
              <div key={rev.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 relative group">
                {/* Delete Button - Only renders for the author */}
                {isMyReview && (
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="absolute top-4 right-4 text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 px-3 py-1 rounded-lg transition-colors font-medium"
                  >
                    Delete Review
                  </button>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-lg">
                    {rev.user?.username ? rev.user.username[0].toUpperCase() : (rev.userName ? rev.userName[0].toUpperCase() : 'U')}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{rev.user?.username || rev.userName || 'Bryan Enriquez'}</h4>
                    <span className="text-amber-400 text-xs">{'★'.repeat(rev.rating)}</span>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm mt-2">{rev.content || rev.comment}</p>
              </div>
            );
          })}

          {reviews.length === 0 && <p className="text-zinc-500">No reviews yet. Be the first to review!</p>}
        </div>

        {/* Leave Review Form */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 h-fit">
          <h3 className="text-xl font-bold mb-4">Leave a Review</h3>
          {hasAlreadyReviewed ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-sm font-semibold">
              You have already reviewed this cafe. You can delete your existing review from the list to write a new one.
            </div>
          ) : (
            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-amber-400 font-bold"
                >
                  <option value={5}>★★★★★ (5/5)</option>
                  <option value={4}>★★★★☆ (4/5)</option>
                  <option value={3}>★★★☆☆ (3/5)</option>
                  <option value={2}>★★☆☆☆ (2/5)</option>
                  <option value={1}>★☆☆☆☆ (1/5)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Comment</label>
                <textarea
                  required
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="What did you think of this cafe?"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white"
                  rows={3}
                />
              </div>
              <button
                disabled={isSubmittingReview}
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 rounded-xl transition-colors"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}