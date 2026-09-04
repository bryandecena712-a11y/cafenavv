'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteReviewButton({ reviewId, reviewUserId }: { reviewId: number; reviewUserId: number }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check multiple common key locations for the user session
    const storedUser = localStorage.getItem('user') || localStorage.getItem('cafenav_user');
    
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Extract ID whether stored as `id` or `user_id`
        const currentId = parsed.id || parsed.user_id;
        
        if (currentId && Number(currentId) === Number(reviewUserId)) {
          setUserId(Number(currentId));
          setCanDelete(true);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }, [reviewUserId]);

  if (!canDelete) return null;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    setIsDeleting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          userId: userId,
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to delete review.');
      }
    } catch (err) {
      alert('An error occurred while deleting the review.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-zinc-400 hover:text-rose-500 text-sm font-medium transition-colors bg-zinc-800/80 hover:bg-rose-500/10 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1"
      title="Delete your review"
    >
      {isDeleting ? 'Deleting...' : '🗑️ Delete'}
    </button>
  );
}