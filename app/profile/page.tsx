'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      fetch(`/api/user/profile?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setProfileData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="animate-spin text-amber-500 text-4xl">◒</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">Error loading profile.</p>
        <button onClick={() => router.push('/')} className="text-amber-500 hover:underline">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Header */}
      <div className="w-full bg-zinc-900 border-b border-white/5 py-12 px-6 pt-24">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-amber-500 flex items-center justify-center text-5xl font-bold text-zinc-950 border-4 border-zinc-950 shadow-2xl">
            {profileData.username.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-bold mb-2">{profileData.username}</h1>
            <p className="text-zinc-400">{profileData.email}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="px-6 py-2.5 rounded-full bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors border border-white/5">
              Home
            </Link>
            <button onClick={logout} className="px-6 py-2.5 rounded-full bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-colors border border-red-500/20">
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Bookmarks Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm">🔖</span>
            Saved Cafes
          </h2>
          
          <div className="space-y-4">
            {profileData.bookmarks && profileData.bookmarks.length > 0 ? (
              profileData.bookmarks.map((bookmark: any) => (
                <Link key={bookmark.id} href={`/cafe/${bookmark.cafe.id}`} className="block group">
                  <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex gap-4 hover:border-amber-500/50 transition-colors items-center">
                    <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                      {bookmark.cafe.image_url ? (
                        <img src={bookmark.cafe.image_url} alt={bookmark.cafe.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">☕</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg group-hover:text-amber-500 transition-colors">{bookmark.cafe.name}</h3>
                      <p className="text-sm text-zinc-400 truncate">{bookmark.cafe.location}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 bg-zinc-900/50 border border-white/5 rounded-2xl">
                <p className="text-zinc-500 mb-2">You haven't saved any cafes yet.</p>
                <Link href="/" className="text-amber-500 hover:underline text-sm font-medium">Explore Map</Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-sm">⭐</span>
            My Reviews
          </h2>
          
          <div className="space-y-4">
            {profileData.reviews && profileData.reviews.length > 0 ? (
              profileData.reviews.map((review: any) => (
                <div key={review.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-6 relative">
                  <Link href={`/cafe/${review.cafe.id}`} className="absolute top-6 right-6 text-xs font-bold text-amber-500 hover:underline">
                    View Cafe
                  </Link>
                  <h3 className="font-bold text-lg mb-1">{review.cafe.name}</h3>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`text-sm ${star <= review.rating ? 'text-amber-500' : 'text-zinc-700'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm italic">"{review.content}"</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-zinc-900/50 border border-white/5 rounded-2xl">
                <p className="text-zinc-500 mb-2">You haven't written any reviews yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
