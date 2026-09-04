'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteReviewButton({ reviewId, reviewUserId }: { reviewId: number; reviewUserId: number }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Read the logged-in user from localStorage (or adjust to your Auth system)
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.id) {
          setCurrentUserId(user.id);
        }
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
  }, []);

  // Only render the delete button if the logged-in user matches the review author
  if (!currentUserId || currentUserId !== reviewUserId) {
    return null;
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    setIsDeleting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          userId: currentUserId,
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete review.');
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
      className="text-zinc-500 hover:text-rose-500 text-xs transition-colors p-1"
      title="Delete Review"
    >
      {isDeleting ? '...' : '🗑️'}
    </button>
  );
}