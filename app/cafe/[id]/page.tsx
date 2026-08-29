import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReviewForm from './ReviewForm';
import BookmarkButton from '@/app/components/BookmarkButton';
import ShareButton from '@/app/components/ShareButton';

export default async function CafeDetailsPage({ params }: { params: { id: string } }) {
  const cafeId = parseInt(params.id, 10);
  
  if (isNaN(cafeId)) {
    notFound();
  }

  const cafe = await prisma.cafes.findUnique({
    where: { id: cafeId },
    include: {
      products: true,
      reviews: {
        include: {
          user: { select: { username: true } }
        },
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!cafe) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      
      {/* Absolute "Go to Map" button over the hero image */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md hover:bg-amber-500 hover:text-zinc-950 text-white px-5 py-2.5 rounded-full border border-white/10 transition-all font-medium text-sm shadow-xl"
        >
          <span className="text-lg leading-none">←</span>
          Go to Map
        </Link>
      </div>

      {/* Bookmark Button */}
      <div className="absolute top-6 right-6 z-20">
        <div className="flex gap-4">
          <ShareButton cafeName={cafe.name} />
          <BookmarkButton cafeId={cafe.id} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative w-full h-[40vh] min-h-[300px] bg-zinc-900 border-b border-white/5">
        {cafe.image_url ? (
          <img 
            src={cafe.image_url} 
            alt={cafe.name || 'Cafe'} 
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-6xl opacity-50">
            ☕
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        {/* Cafe Info overlay */}
        <div className="absolute bottom-0 left-0 w-full p-8 max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-md mb-2">
            {cafe.name}
          </h1>
          <p className="text-zinc-300 max-w-2xl text-lg drop-shadow">
            {cafe.description}
          </p>
        </div>
      </div>

      {/* Content Section (Menu) */}
      <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm">🍽️</span>
          Menu Products
        </h2>
        
        {cafe.products && cafe.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cafe.products.map((product) => (
              <div 
                key={product.id} 
                className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-colors flex flex-col group shadow-lg"
              >
                <div className="w-full h-48 bg-zinc-800 relative overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">☕</div>
                  )}
                  <div className="absolute top-3 right-3 bg-zinc-950/90 backdrop-blur text-amber-400 font-bold px-3 py-1.5 rounded-full text-sm border border-amber-500/20 shadow-md">
                    {product.price}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-white mb-2">{product.name}</h3>
                  <p className="text-zinc-400 text-sm flex-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900/50 border border-white/5 rounded-3xl">
            <span className="text-4xl mb-4 block">📝</span>
            <h3 className="text-xl font-medium text-white mb-2">No menu available</h3>
            <p className="text-zinc-500">This cafe hasn't added any products to their menu yet.</p>
          </div>
        )}
      </div>
      
      {/* Reviews Section */}
      <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm">⭐</span>
          Community Reviews
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {cafe.reviews && cafe.reviews.length > 0 ? (
              cafe.reviews.map((review) => (
                <div key={review.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950 font-bold text-lg">
                        {review.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white leading-none">{review.user.username}</h4>
                        <span className="text-xs text-zinc-500">{review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recently'}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-lg ${star <= review.rating ? 'text-amber-500' : 'text-zinc-700'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{review.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-zinc-900/50 border border-white/5 rounded-3xl">
                <span className="text-4xl mb-4 block">💬</span>
                <h3 className="text-xl font-medium text-white mb-2">No reviews yet</h3>
                <p className="text-zinc-500">Be the first to share your thoughts on {cafe.name}!</p>
              </div>
            )}
          </div>

          {/* Leave a Review Form */}
          <div className="lg:col-span-1">
            <ReviewForm cafeId={cafe.id} />
          </div>
        </div>
      </div>

    </div>
  );
}
