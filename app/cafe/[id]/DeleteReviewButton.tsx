'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteReviewButton({ reviewId, reviewUserId }: { reviewId: number; reviewUserId: number }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('cafenav_user') || localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const currentId = Number(parsed.id || parsed.user_id);
        const targetId = Number(reviewUserId);

        if (currentId && currentId === targetId) {
          setUserId(currentId);
          setCanDelete(true);
        }
      } catch (e) {
        console.error('Error parsing user session:', e);
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
          reviewId: Number(reviewId),
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
      className="text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2 py-1 rounded-md flex items-center gap-1"
      title="Delete Review"
    >
      {isDeleting ? 'Deleting...' : '🗑️ Delete'}
    </button>
  );
}