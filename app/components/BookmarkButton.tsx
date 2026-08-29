'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { BookmarkSimple } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

interface BookmarkButtonProps {
  cafeId: number;
}

export default function BookmarkButton({ cafeId }: BookmarkButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    // Check if it's already bookmarked by fetching the user's profile
    fetch(`/api/user/profile?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.bookmarks) {
          const found = data.bookmarks.some((b: any) => b.cafe_id === cafeId);
          setIsBookmarked(found);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated, user, cafeId]);

  const toggleBookmark = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        await fetch('/api/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cafeId, userId: user.id })
        });
        setIsBookmarked(false);
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cafeId, userId: user.id })
        });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 shadow-xl opacity-50 cursor-not-allowed">
        <BookmarkSimple size={24} />
      </button>
    );
  }

  return (
    <button 
      onClick={toggleBookmark}
      className={`flex items-center justify-center w-12 h-12 rounded-full shadow-xl transition-all ${
        isBookmarked 
          ? 'bg-amber-500 border border-amber-400 text-zinc-950 hover:bg-amber-400' 
          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-500 hover:border-amber-500/50'
      }`}
      title={isBookmarked ? "Remove from Saved" : "Save Cafe"}
    >
      <BookmarkSimple size={24} weight={isBookmarked ? "fill" : "regular"} />
    </button>
  );
}
