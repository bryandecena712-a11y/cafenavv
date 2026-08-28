'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function EmptyState() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="col-span-full py-24 px-6 bg-zinc-900/30 backdrop-blur-md border border-dashed border-white/10 rounded-[32px] text-center flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-zinc-800/80 rounded-full flex items-center justify-center text-3xl mb-6 border border-white/5 shadow-xl">☕</div>
      <h3 className="text-2xl font-semibold text-white mb-3">No coffee shops yet</h3>
      
      {user?.isAdmin ? (
        <>
          <p className="text-zinc-400 max-w-md mb-8 text-lg">It looks like there aren't any cafes listed in your area right now. Be the first to add one from the Admin Dashboard!</p>
          <button 
            onClick={() => router.push('/admin')} 
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-8 py-3.5 rounded-full transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
          >
            Go to Admin Dashboard
          </button>
        </>
      ) : (
        <p className="text-zinc-400 max-w-md mb-8 text-lg">Wait for the admin to add one.</p>
      )}
    </div>
  );
}
