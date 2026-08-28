'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CafeDetailsClientProps {
  cafe: any;
}

// Mock Menu Data
const MOCK_MENU = [
  { id: 1, name: 'Flat White', category: 'Coffee', price: 150, popularity: 98, hearts: 342 },
  { id: 2, name: 'Matcha Latte', category: 'Tea', price: 180, popularity: 95, hearts: 289 },
  { id: 3, name: 'Iced Americano', category: 'Coffee', price: 130, popularity: 92, hearts: 256 },
  { id: 4, name: 'Almond Croissant', category: 'Pastry', price: 120, popularity: 88, hearts: 198 },
  { id: 5, name: 'Pour Over', category: 'Coffee', price: 200, popularity: 85, hearts: 145 },
  { id: 6, name: 'Espresso Tonic', category: 'Coffee', price: 160, popularity: 75, hearts: 89 },
];

// Mock Chat Data
const INITIAL_CHAT = [
  { id: 1, author: 'Sarah J.', avatar: 'S', text: 'Anyone working here today? How is the wifi?', time: '10:42 AM', isMe: false },
  { id: 2, author: 'Mike T.', avatar: 'M', text: 'Wifi is solid! Around 150mbps down. It is getting a bit crowded though.', time: '10:45 AM', isMe: false },
  { id: 3, author: 'Sarah J.', avatar: 'S', text: 'Awesome, thanks! Grabbing a flat white and heading over.', time: '10:46 AM', isMe: false },
];

const ACTIVE_USERS = ['S', 'M', 'J', 'A', 'K'];

export default function CafeDetailsClient({ cafe }: CafeDetailsClientProps) {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews' | 'community'>('menu');

  // Menu State
  const [sortMethod, setSortMethod] = useState<'popularity' | 'price'>('popularity');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Review State
  const [reviews, setReviews] = useState([
    {
      id: 1,
      title: 'Amazing atmosphere',
      rating: 5,
      body: 'This has become my go-to spot for working. The wifi is fast, the coffee is top tier, and the staff are always friendly. Highly recommend the flat white!',
      author: 'Alex D.',
      date: 'Oct 12'
    }
  ]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ title: '', rating: 0, body: '' });
  const [hoveredStar, setHoveredStar] = useState(0);

  // Chat State
  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'community') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handlers
  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sortedMenu = [...MOCK_MENU].sort((a, b) => {
    if (sortMethod === 'popularity') return b.popularity - a.popularity;
    return a.price - b.price;
  });

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.rating === 0) {
      alert('Please select a star rating.');
      return;
    }
    
    const review = {
      id: Date.now(),
      title: newReview.title || 'Review',
      rating: newReview.rating,
      body: newReview.body,
      author: 'You',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    
    setReviews([review, ...reviews]);
    setIsReviewModalOpen(false);
    setNewReview({ title: '', rating: 0, body: '' });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages([...messages, {
      id: Date.now(),
      author: 'You',
      avatar: 'Y',
      text: newMessage,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isMe: true
    }]);
    setNewMessage('');
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 pb-24">
      {/* Back Button Overlay */}
      <div className="fixed top-6 left-6 z-40">
        <Link 
          href="/"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 text-white/90 hover:text-white hover:bg-zinc-800/80 hover:scale-105 active:scale-95 transition-all shadow-2xl"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-[350px] md:h-[450px]">
        <Image 
          src={cafe.image_url || '/images/brewco.jpg'} 
          alt={cafe.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 max-w-4xl mx-auto px-6 text-center">
          <div className="text-xs font-bold tracking-[0.2em] text-amber-500 uppercase mb-3">
            {cafe.location}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
            {cafe.name}
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 pt-4 pb-0">
        <div className="max-w-3xl mx-auto px-6 flex justify-center gap-8">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`pb-4 px-2 text-sm font-semibold transition-all border-b-2 ${activeTab === 'menu' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            Menu & Info
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 px-2 text-sm font-semibold transition-all border-b-2 ${activeTab === 'reviews' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            Reviews
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`pb-4 px-2 text-sm font-semibold transition-all border-b-2 ${activeTab === 'community' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300 flex items-center gap-2'}`}
          >
            Community
            <span className="bg-amber-500/20 text-amber-500 text-[10px] px-1.5 py-0.5 rounded-full">Live</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-10">
        
        {/* TAB 1: MENU & INFO */}
        {activeTab === 'menu' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Description */}
            <section className="text-center max-w-2xl mx-auto">
              <p className="text-lg leading-relaxed text-zinc-300">
                {cafe.description || "A cozy spot for your daily grind. Enjoy expertly crafted coffee in a warm, inviting atmosphere perfect for getting work done or catching up with friends."}
              </p>
            </section>

            {/* Menu */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">Menu</h2>
                
                {/* Segmented Control */}
                <div className="flex items-center bg-zinc-900/80 backdrop-blur-md rounded-full p-1 border border-white/5">
                  <button 
                    onClick={() => setSortMethod('popularity')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${sortMethod === 'popularity' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Popular
                  </button>
                  <button 
                    onClick={() => setSortMethod('price')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${sortMethod === 'price' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Price
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {sortedMenu.map((item) => (
                  <div key={item.id} className="group flex items-center justify-between p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
                        <span className="text-2xl">{item.category === 'Coffee' ? '☕' : item.category === 'Tea' ? '🍵' : '🥐'}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-100 text-lg">{item.name}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-amber-500 font-bold">₱{item.price}</span>
                          <span className="text-sm text-zinc-500 font-medium flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full">
                            {item.hearts + (favorites.has(item.id) ? 1 : 0)} 
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={favorites.has(item.id) ? "#f43f5e" : "currentColor"} className={favorites.has(item.id) ? "text-rose-500" : "text-zinc-600"} stroke="none">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => toggleFavorite(item.id)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${favorites.has(item.id) ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border-white/5'} border`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={favorites.has(item.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-bold text-white tracking-tight">Ratings & Reviews</h2>
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-bold px-5 py-2.5 rounded-full transition-transform active:scale-95 shadow-lg"
              >
                Write Review
              </button>
            </div>
            
            {/* App Store Style Rating Block */}
            <div className="flex items-center gap-8 mb-10 bg-zinc-900/30 p-8 rounded-[32px] border border-white/5">
              <div className="flex flex-col items-center justify-center">
                <span className="text-[6rem] font-bold tracking-tighter text-white leading-none">4.8</span>
                <span className="text-[12px] font-bold text-zinc-500 mt-2 uppercase tracking-[0.2em]">Out of 5</span>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 pt-2">
                {[
                  { stars: 5, width: '85%' },
                  { stars: 4, width: '10%' },
                  { stars: 3, width: '3%' },
                  { stars: 2, width: '1%' },
                  { stars: 1, width: '1%' },
                ].map((row) => (
                  <div key={row.stars} className="flex items-center gap-4">
                    <div className="flex text-zinc-400 text-[10px] tracking-[-1px] w-14 justify-end">{'★'.repeat(row.stars)}</div>
                    <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-300 rounded-full" style={{ width: row.width }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-zinc-400 mb-8 pb-8 border-b border-white/5">
              <span>{123 + reviews.length} Ratings</span>
            </div>

            {/* Reviews List */}
            <div className="flex flex-col gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white/[0.02] rounded-[24px] p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-white text-base tracking-tight">{review.title}</div>
                    <div className="text-zinc-500 text-sm font-medium">{review.date}</div>
                  </div>
                  <div className="flex text-amber-500 text-sm mb-4 tracking-tight">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <p className="text-[15px] text-zinc-300 leading-relaxed">
                    "{review.body}"
                  </p>
                  <div className="mt-5 text-sm font-medium text-zinc-500 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">
                      {review.author.charAt(0)}
                    </div>
                    {review.author}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COMMUNITY CHAT */}
        {activeTab === 'community' && (
          <div className="flex flex-col h-[600px] bg-zinc-900/30 rounded-[32px] border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Active Users Bar */}
            <div className="flex items-center gap-3 p-4 bg-zinc-900/50 border-b border-white/5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2 shrink-0">Online Now</div>
              {ACTIVE_USERS.map((user, i) => (
                <div key={i} className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-sm font-medium text-white shadow-sm">
                    {user}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full"></div>
                </div>
              ))}
            </div>

            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:hidden">
              <div className="text-center text-xs text-zinc-500 font-medium mb-8">Welcome to the {cafe.name} Community!</div>
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex w-full ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[80%] ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {!msg.isMe && (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-white shrink-0 mt-1">
                        {msg.avatar}
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      {!msg.isMe && <span className="text-xs text-zinc-500 mb-1 ml-1">{msg.author}</span>}
                      
                      <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed ${
                        msg.isMe 
                          ? 'bg-amber-500 text-zinc-950 rounded-tr-sm shadow-[0_4px_14px_rgba(245,158,11,0.2)]' 
                          : 'bg-zinc-800/80 text-white rounded-tl-sm border border-white/5'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-zinc-600 mt-1">{msg.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-white/5">
              <form onSubmit={sendMessage} className="flex items-center gap-3 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask the community..."
                  className="flex-1 bg-zinc-950/50 border border-white/10 rounded-full px-5 py-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all pr-12"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all hover:bg-amber-400 active:scale-95"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsReviewModalOpen(false)} />
          <div className="relative w-full sm:w-[500px] bg-zinc-950/90 backdrop-blur-2xl sm:rounded-[32px] rounded-t-[32px] border border-white/10 shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold text-white mb-8 tracking-tight">Write a Review</h3>
            
            <form onSubmit={submitReview} className="flex flex-col gap-6">
              {/* Star Rating */}
              <div className="flex flex-col items-center gap-3">
                <div className="text-sm font-medium text-zinc-400">Tap to Rate</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="text-4xl transition-transform active:scale-90 hover:scale-110"
                    >
                      <span className={`${star <= (hoveredStar || newReview.rating) ? 'text-amber-500' : 'text-zinc-800'}`}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-300">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize your experience"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
              </div>

              {/* Body Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-300">Review</label>
                <textarea
                  required
                  rows={4}
                  placeholder="What did you think of the coffee and atmosphere?"
                  value={newReview.body}
                  onChange={(e) => setNewReview({ ...newReview, body: e.target.value })}
                  className="bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 text-zinc-950 font-bold py-4 rounded-xl mt-4 hover:bg-amber-400 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
