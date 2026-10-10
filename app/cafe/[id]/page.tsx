import { prisma } from '@/app/lib/prisma';
import Link from 'next/link';
import ReviewForm from './ReviewForm';
import BookmarkButton from '@/app/components/BookmarkButton';
import ShareButton from '@/app/components/ShareButton';
import SuggestProductForm from './SuggestProductForm';
import DeleteReviewButton from './DeleteReviewButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function formatTime(timeStr?: string | null): string {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0])) return timeStr;
  const [h, m] = parts;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 || isNaN(m) ? `${displayHour} ${period}` : `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

function getRealTimeStatus(operatingHoursStr?: string | null | object) {
  const defaultHours: Record<string, { open: string; close: string; isClosed: boolean }> = {
    Monday: { open: '09:00', close: '23:00', isClosed: false },
    Tuesday: { open: '09:00', close: '23:00', isClosed: false },
    Wednesday: { open: '09:00', close: '23:00', isClosed: false },
    Thursday: { open: '09:00', close: '23:00', isClosed: false },
    Friday: { open: '09:00', close: '01:00', isClosed: false },
    Saturday: { open: '09:00', close: '01:00', isClosed: false },
    Sunday: { open: '09:00', close: '01:00', isClosed: false },
  };

  let schedule = defaultHours;
  if (operatingHoursStr) {
    try {
      const parsed = typeof operatingHoursStr === 'string' ? JSON.parse(operatingHoursStr) : operatingHoursStr;
      if (parsed && typeof parsed === 'object') {
        schedule = { ...defaultHours, ...parsed };
      }
    } catch {
      schedule = defaultHours;
    }
  }

  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Manila', hourCycle: 'h23', weekday: 'long', hour: 'numeric', minute: 'numeric' };
  const phParts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);

  let currentDayName = 'Friday';
  let currentHour = 0;
  let currentMinute = 0;

  phParts.forEach((part) => {
    if (part.type === 'weekday') currentDayName = part.value;
    if (part.type === 'hour') currentHour = parseInt(part.value, 10);
    if (part.type === 'minute') currentMinute = parseInt(part.value, 10);
  });

  const todaySchedule = schedule[currentDayName];

  if (!todaySchedule || todaySchedule.isClosed || !todaySchedule.open || !todaySchedule.close) {
    return { isOpen: false, text: 'Closed today', schedule };
  }

  let [openH, openM] = (todaySchedule.open || '09:00').split(':').map(Number);
  let [closeH, closeM] = (todaySchedule.close || '23:00').split(':').map(Number);

  if (isNaN(openH)) openH = 9;
  if (isNaN(openM)) openM = 0;
  if (isNaN(closeH)) closeH = 23;
  if (isNaN(closeM)) closeM = 0;

  if (closeH === 0 && closeM === 0) {
    closeH = 24;
  }

  const currentMinutes = currentHour * 60 + currentMinute;
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;

  let isOpen = false;
  if (closeMinutes <= openMinutes && closeH !== 24) {
    closeMinutes += 24 * 60;
    const adjustedCurrentMinutes = currentMinutes < openMinutes ? currentMinutes + 24 * 60 : currentMinutes;
    isOpen = adjustedCurrentMinutes >= openMinutes && adjustedCurrentMinutes < closeMinutes;
  } else {
    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  return {
    isOpen,
    text: isOpen
      ? `${formatTime(todaySchedule.open)} – ${formatTime(todaySchedule.close)}`
      : `Opens at ${formatTime(todaySchedule.open)}`,
    schedule,
  };
}

export default async function CafeDetailsPage(props: any) {
  const resolvedParams = props?.params ? await Promise.resolve(props.params) : {};
  const rawId = resolvedParams?.id;
  const cafeId = parseInt(rawId, 10);

  let cafe: any = null;

  if (rawId) {
    // 1. Strict primary DB lookup by exact numeric ID
    if (!isNaN(cafeId)) {
      try {
        cafe = await prisma.cafes.findUnique({
          where: { id: cafeId },
          include: {
            products: true,
            reviews: {
              include: {
                user: { select: { id: true, username: true } }
              },
              orderBy: { created_at: 'desc' }
            }
          }
        });
      } catch (dbErr) {
        console.error('Prisma query error:', dbErr);
      }
    }

    // 2. Secondary fallback lookup by exact name string (only if numeric ID search yielded no result)
    if (!cafe) {
      try {
        cafe = await prisma.cafes.findFirst({
          where: { name: { equals: rawId, mode: 'insensitive' } },
          include: {
            products: true,
            reviews: {
              include: {
                user: { select: { id: true, username: true } }
              },
              orderBy: { created_at: 'desc' }
            }
          }
        });
      } catch (err) {
        console.error('Name fallback query error:', err);
      }
    }
  }

  // Graceful view when cafe is completely missing
  if (!cafe) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">☕</span>
        <h1 className="text-3xl font-bold mb-2">Cafe Not Found</h1>
        <p className="text-zinc-400 mb-6 max-w-md">
          We couldn't find a cafe matching "{rawId || 'unknown'}".
        </p>
        <Link 
          href="/" 
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-full transition-all"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const parseList = (data: any): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return Array.isArray(parsed) ? parsed : [String(data)];
    } catch {
      return String(data).split(',').map((item) => item.trim());
    }
  };

  const serviceOptions = parseList((cafe as any).service_options);
  const offeringsOptions = parseList((cafe as any).offerings);
  const { isOpen, text: statusText, schedule } = getRealTimeStatus((cafe as any).operating_hours);

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md hover:bg-amber-500 hover:text-zinc-950 text-white px-5 py-2.5 rounded-full border border-white/10 transition-all font-medium text-sm shadow-xl"
        >
          <span className="text-lg leading-none">←</span>
          Back to Home
        </Link>
      </div>

      {/* Share & Bookmark */}
      <div className="absolute top-6 right-6 z-20">
        <div className="flex gap-4">
          <ShareButton cafeName={cafe.name || 'Cafe'} />
          <BookmarkButton cafeId={cafe.id} />
        </div>
      </div>

      {/* Hero Header */}
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
        
        <div className="absolute bottom-0 left-0 w-full p-8 max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-md mb-2">
            {cafe.name}
          </h1>
          <p className="text-zinc-300 max-w-2xl text-lg drop-shadow">
            {cafe.description}
          </p>
        </div>
      </div>

      {/* Menu Products */}
      <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm">🍽️</span>
          Menu Products
        </h2>
        
        {cafe.products && cafe.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cafe.products.map((product: any) => (
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
                    ₱{product.price}
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
        
        <SuggestProductForm cafeId={cafe.id} />
      </div>

      {/* Operating Hours */}
      <div className="max-w-6xl mx-auto px-8 py-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm">🕒</span>
              Opening Hours & Schedule
            </h2>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold ${
              isOpen
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isOpen ? 'Open' : 'Close'}</span>
              <span className="text-zinc-500 font-normal">({statusText})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const item = schedule[day];
              return (
                <div key={day} className="bg-zinc-950/60 border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{day}</span>
                  <span className="text-sm font-semibold text-zinc-100 mt-1">
                    {item?.isClosed ? (
                      <span className="text-rose-400 font-medium">Closed</span>
                    ) : (
                      `${formatTime(item?.open)} - ${formatTime(item?.close)}`
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm">⭐</span>
          Community Reviews
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cafe.reviews && cafe.reviews.length > 0 ? (
              cafe.reviews.map((review: any) => (
                <div key={review.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950 font-bold text-lg">
                        {review.user?.username ? review.user.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white leading-none">{review.user?.username || 'Anonymous'}</h4>
                        <span className="text-xs text-zinc-500">{review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recently'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`text-lg ${star <= review.rating ? 'text-amber-500' : 'text-zinc-700'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <DeleteReviewButton 
                        reviewId={review.id} 
                        reviewUserId={review.user_id || review.user?.id} 
                      />
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

          <div className="lg:col-span-1">
            <ReviewForm cafeId={cafe.id} />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="max-w-6xl mx-auto p-8 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm">ℹ️</span>
            About {cafe.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {serviceOptions.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Service Options</h3>
                  <div className="flex flex-wrap gap-2">
                    {serviceOptions.map((option, idx) => (
                      <span key={idx} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-medium">
                        ✓ {option}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {offeringsOptions.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Offerings</h3>
                  <div className="flex flex-wrap gap-2">
                    {offeringsOptions.map((offering, idx) => (
                      <span key={idx} className="bg-zinc-800 text-zinc-300 border border-white/5 px-3 py-1.5 rounded-xl text-xs font-medium">
                        ☕ {offering}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Connect & Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(cafe as any).facebook_url && (
                  <a
                    href={(cafe as any).facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-zinc-950 border border-white/5 hover:border-amber-500/50 p-3 rounded-2xl text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <span>🌐</span> Facebook
                  </a>
                )}
                {(cafe as any).instagram_url && (
                  <a
                    href={(cafe as any).instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-zinc-950 border border-white/5 hover:border-amber-500/50 p-3 rounded-2xl text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <span>📸</span> Instagram
                  </a>
                )}
                {(cafe as any).tiktok_url && (
                  <a
                    href={(cafe as any).tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-zinc-950 border border-white/5 hover:border-amber-500/50 p-3 rounded-2xl text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <span>🎵</span> TikTok
                  </a>
                )}
                {(cafe as any).website_url && (
                  <a
                    href={(cafe as any).website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-zinc-950 border border-white/5 hover:border-amber-500/50 p-3 rounded-2xl text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <span>🔗</span> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}