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

async function fetchCafeWithRetry(cafeId: number) {
  const query = () =>
    prisma.cafes.findUnique({
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

  let result: any = await query().catch(() => null);

  if (!result) {
    await new Promise((res) => setTimeout(res, 350));
    result = await query().catch(() => null);
  }

  if (!result) {
    result = await prisma.cafes.findUnique({ where: { id: cafeId } }).catch(() => null);
  }

  return result;
}

export default async function CafeDetailsPage(props: any) {
  const resolvedParams = props?.params ? await Promise.resolve(props.params) : {};
  const rawId = resolvedParams?.id;
  const cafeId = parseInt(rawId, 10);

  let cafe: any = null;

  if (!isNaN(cafeId)) {
    cafe = await fetchCafeWithRetry(cafeId);
  } else if (rawId) {
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
      cafe = null;
    }
  }

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
                    className="flex items-center gap-2.5 bg-zinc-950 border border-white/5 hover:border-amber-500/50 p-3 rounded-2xl text-xs text-zinc-300 hover:text-white transition-colors group"
                  >
                    <svg className="w-4 h-4 fill-blue-500 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </a>
                )}
                {(cafe as any).instagram_url && (
                  <a
                    href={(cafe as any).instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-zinc-950 border border-white/5 hover:border-amber-500/50 p-3 rounded-2xl text-xs text-zinc-300 hover:text-white transition-colors group"
                  >
                    <svg className="w-4 h-4 fill-pink-500 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>Instagram</span>
                  </a>
                )}
                {(cafe as any).tiktok_url && (
                  <a
                    href={(cafe as any).tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-zinc-950 border border-white/5 hover:border-amber-500/50 p-3 rounded-2xl text-xs text-zinc-300 hover:text-white transition-colors group"
                  >
                    <svg className="w-4 h-4 fill-zinc-100 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.52-1.29 2.51.01 1.02.58 1.96 1.46 2.45.87.5 1.97.51 2.85.03.82-.45 1.35-1.32 1.39-2.27.01-4.8.01-9.6.01-14.4z"/>
                    </svg>
                    <span>TikTok</span>
                  </a>
                )}
                {(cafe as any).website_url && (
                  <a
                    href={(cafe as any).website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-zinc-950 border border-white/5 hover:border-amber-500/50 p-3 rounded-2xl text-xs text-zinc-300 hover:text-white transition-colors group"
                  >
                    <svg className="w-4 h-4 fill-amber-500 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.967 7h-3.23c-.328-1.503-.842-2.91-1.528-4.167A10.021 10.021 0 0118.967 7zM12 2.054c.828 1.35 1.465 2.887 1.865 4.946H10.135c.4-2.059 1.037-3.596 1.865-4.946zM2.808 14c-.135-.646-.208-1.314-.208-2s.073-1.354.208-2h3.948c-.06.653-.096 1.319-.096 2 0 .681.036 1.347.096 2H2.808zm1.025 2h3.23c.328 1.503.842 2.91 1.528 4.167A10.021 10.021 0 013.833 16zm3.23-10H3.833a10.021 10.021 0 014.372-4.167C7.519 3.09 7.005 4.497 6.678 6zM12 21.946c-.828-1.35-1.465-2.887-1.865-4.946h3.73c-.4 2.059-1.037 3.596-1.865 4.946zM14.28 14H9.72c-.068-.652-.108-1.319-.108-2 0-.681.04-1.348.108-2h4.56c.068.652.108 1.319.108 2 0 .681-.04 1.348-.108 2zm1.888 6.167c.686-1.257 1.2-2.664 1.528-4.167h3.23a10.021 10.021 0 01-4.372 4.167zM17.244 14c.06-.653.096-1.319.096-2 0-.681-.036-1.347-.096-2h3.948c.135.646.208 1.314.208 2s-.073 1.354-.208 2h-3.948z"/>
                    </svg>
                    <span>Website</span>
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