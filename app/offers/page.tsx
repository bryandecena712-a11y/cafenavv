'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle } from '@phosphor-icons/react';

export default function Offers() {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});

  const startQuiz = () => setStep(1);
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSelect = (optionValue: string) => {
    setSelections({ ...selections, [step]: optionValue });
  };

  const currentSelection = selections[step];

  const quizData = [
    {
      title: "What are you drinking?",
      category: "COFFEE TYPE",
      options: [
        { title: "Pour Over", value: "Pour Over", desc: "Clean, nuanced, filter coffee" },
        { title: "Espresso", value: "Espresso", desc: "Strong, concentrated shot" },
        { title: "Milk Based", value: "Milk Based", desc: "Latte, flat white, cappuccino" },
        { title: "Not Coffee", value: "Not Coffee", desc: "Matcha, tea, hot chocolate" }
      ]
    },
    {
      title: "What do you need there?",
      category: "NEEDS",
      options: [
        { title: "Deep Work", value: "Deep Work", desc: "Quiet, fast wifi, outlets" },
        { title: "Social Catch-up", value: "Social Catch-up", desc: "Lively, good acoustics, spacious" },
        { title: "Quick Grab", value: "Quick Grab", desc: "Fast service, standing room" },
        { title: "Reading/Chill", value: "Reading/Chill", desc: "Cozy seating, natural light" }
      ]
    },
    {
      title: "Which price fits you?",
      category: "PRICE RANGE",
      options: [
        { title: "₱100-300", value: "₱100-300", desc: "Affordable Price" },
        { title: "₱150-300", value: "₱150-300", desc: "Standard Price" },
        { title: "₱200-500", value: "₱200-500", desc: "High-end Experience" },
        { title: "Any Price", value: "Any Price", desc: "Show all shops regardless of price" }
      ]
    },
    {
      title: "What ambiance setting do you prefer?",
      category: "CAFE ENVIRONMENT",
      options: [
        { title: "Indoor Cafe", value: "Indoor Cafe", desc: "Air-conditioned, cozy interior seating" },
        { title: "Outdoor Cafe", value: "Outdoor Cafe", desc: "Al-fresco, open air, garden ambiance" },
        { title: "Both Indoor & Outdoor", value: "Both Indoor & Outdoor", desc: "Versatile space offering both inside and outside seating" }
      ]
    }
  ];

  if (step === 0) {
    return (
      <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950 min-h-screen">
        <Image src="/images/home-bg.jpg" alt="Coffee shop" fill className="object-cover opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        
        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-semibold rounded-full text-sm hover:bg-amber-500 transition-colors shadow-md"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold tracking-tighter text-white mb-6"
          >
            Find your perfect shop.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-300 mb-10 max-w-lg leading-relaxed"
          >
            Answer four quick questions about what you look for in a coffee shop — we'll match you to spaces that suit how you like to spend your time.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={startQuiz} 
            className="bg-amber-600 text-white px-10 py-4 rounded-full font-medium tracking-wide hover:bg-amber-500 active:scale-95 transition-all cursor-pointer"
          >
            Start Matchmaker
          </motion.button>
        </div>
      </main>
    );
  }

  if (step >= 1 && step <= quizData.length) {
    const data = quizData[step - 1];
    const isGrid3 = data.options.length === 3;

    return (
      <main className="flex-1 flex flex-col bg-stone-50 min-h-screen">
        <div className="max-w-4xl mx-auto w-full px-6 py-12 flex-1 flex flex-col">
          <div className="mb-12">
            <div className="flex items-center justify-between text-sm font-medium text-zinc-500 mb-4">
              <button onClick={prevStep} className="hover:text-zinc-900 transition-colors cursor-pointer">&larr; Back</button>
              <span>{step} of {quizData.length}</span>
            </div>
            <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-zinc-900"
                initial={{ width: `${((step - 1) / quizData.length) * 100}%` }}
                animate={{ width: `${(step / quizData.length) * 100}%` }}
                transition={{ ease: "easeInOut", duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-10">
                <span className="text-xs font-bold tracking-[0.15em] text-amber-600 uppercase mb-3 block">{data.category}</span>
                <h2 className="text-4xl font-bold tracking-tight text-zinc-950">{data.title}</h2>
              </div>

              <div className={`grid gap-4 ${isGrid3 ? 'md:grid-cols-3' : 'sm:grid-cols-2'} mb-12`}>
                {data.options.map((opt) => {
                  const isSelected = currentSelection === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`text-left p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-zinc-900 bg-zinc-900 shadow-lg' 
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                          {opt.title}
                        </h3>
                        {isSelected && <CheckCircle size={24} weight="fill" className="text-amber-500 shrink-0" />}
                      </div>
                      <p className={`text-sm leading-relaxed ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto">
                <button 
                  onClick={nextStep} 
                  disabled={!currentSelection}
                  className="w-full md:w-auto md:min-w-[200px] bg-zinc-950 disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-medium py-4 px-8 rounded-full transition-all hover:bg-zinc-800 disabled:hover:bg-zinc-300 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {step === quizData.length ? "Find My Coffee Shop" : "Continue"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    );
  }

  // Results View
  if (step === quizData.length + 1) {
    return <ResultsView selections={selections} onRestart={() => setStep(1)} />;
  }

  return null;
}

function ResultsView({ selections, onRestart }: { selections: Record<number, string>; onRestart: () => void }) {
  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to resolve environment setting from cafe properties or embedded tags
  const getCafeEnvironment = (cafe: any): string => {
    if (cafe.environment) return cafe.environment.trim();
    if (cafe.description && cafe.description.includes('[ENV:')) {
      const match = cafe.description.match(/\[ENV:(.*?)\]/);
      if (match && match[1]) return match[1].trim();
    }
    return 'Both Indoor & Outdoor';
  };

  // Helper to extract clean description
  const getCleanDescription = (desc?: string): string => {
    if (!desc) return '';
    return desc.replace(/\[ENV:.*?\]/g, '').replace(/\[USER:.*?\]/g, '').trim();
  };

  // Helper to strictly evaluate Coffee Type options
  const matchesCoffeeType = (cafe: any, userCoffeeType: string): boolean => {
    if (!userCoffeeType) return true;
    const lowerType = userCoffeeType.toLowerCase();

    // Direct check on cafe offerings if available
    if (cafe.offerings) {
      const offeringsStr = Array.isArray(cafe.offerings) 
        ? cafe.offerings.join(' ').toLowerCase() 
        : String(cafe.offerings).toLowerCase();

      if (lowerType.includes('not coffee')) {
        if (offeringsStr.includes('tea') || offeringsStr.includes('matcha') || offeringsStr.includes('non-coffee')) return true;
      }
    }

    // Check products array if available
    if (Array.isArray(cafe.products) && cafe.products.length > 0) {
      return cafe.products.some((p: any) => {
        const pName = (p.name || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();

        if (lowerType.includes('not coffee')) {
          return pName.includes('matcha') || pName.includes('tea') || pName.includes('chocolate') || pDesc.includes('non-coffee');
        }
        if (lowerType.includes('espresso')) {
          return pName.includes('espresso') || pName.includes('americano') || pName.includes('shot');
        }
        if (lowerType.includes('milk')) {
          return pName.includes('latte') || pName.includes('cappuccino') || pName.includes('flat white') || pName.includes('milk');
        }
        if (lowerType.includes('pour over')) {
          return pName.includes('pour over') || pName.includes('filter') || pName.includes('v60') || pName.includes('drip');
        }
        return true;
      });
    }

    return true; // Default match if product inventory details aren't provided
  };

  useEffect(() => {
    const userCoffeeType = selections[1] || '';
    const userNeed = selections[2] || '';
    const userPrice = selections[3] || '';
    const userEnv = selections[4] || '';

    fetch('/api/cafes')
      .then((res) => res.json())
      .then((data) => {
        const allCafes = Array.isArray(data) ? data : [];

        // Apply STRICT filtering on all 4 criteria
        const filtered = allCafes.filter((cafe) => {
          // 1. Strict Environment Match
          const cafeEnv = getCafeEnvironment(cafe).toLowerCase();
          const targetEnv = userEnv.toLowerCase();

          if (targetEnv && targetEnv !== 'both indoor & outdoor') {
            if (targetEnv === 'indoor cafe' && !cafeEnv.includes('indoor')) return false;
            if (targetEnv === 'outdoor cafe' && !cafeEnv.includes('outdoor')) return false;
          }

          // 2. Strict Price Range Match
          if (userPrice && userPrice !== 'Any Price') {
            const cafePrice = (cafe.price_level || cafe.price_range || '').trim();
            if (cafePrice && cafePrice !== 'Any Price' && cafePrice !== userPrice) {
              return false;
            }
          }

          // 3. Strict Need / Vibe Match
          if (userNeed) {
            const cafeVibe = (cafe.vibe || '').toLowerCase();
            const targetNeed = userNeed.toLowerCase();
            if (cafeVibe && !cafeVibe.includes(targetNeed) && !targetNeed.includes(cafeVibe)) {
              return false;
            }
          }

          // 4. Coffee Type Match
          if (!matchesCoffeeType(cafe, userCoffeeType)) {
            return false;
          }

          return true;
        });

        setCafes(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch matched cafes:', err);
        setCafes([]);
        setLoading(false);
      });
  }, [selections]);

  return (
    <main className="flex-1 flex flex-col bg-zinc-950 text-stone-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Your personalized matches</h1>
            {!loading && (
              <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                <CheckCircle size={18} weight="fill" />
                <span>
                  {cafes.length} coffee {cafes.length === 1 ? 'shop' : 'shops'} perfectly matching all your preferences.
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onRestart}
            className="bg-zinc-900 border border-white/10 hover:border-amber-500 text-zinc-300 hover:text-white px-5 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            🔄 Retake Survey
          </button>
        </motion.div>

        {loading ? (
          <div className="text-zinc-500 animate-pulse text-center py-20">Analyzing matches...</div>
        ) : cafes.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-16 text-center">
            <span className="text-5xl mb-4 block">☕</span>
            <h3 className="text-xl font-bold text-white mb-2">No Exact Matches Found</h3>
            <p className="text-zinc-400 max-w-md mx-auto text-sm mb-6 leading-relaxed">
              No cafes currently match all 4 of your selected criteria perfectly. Try retaking the survey with broader selections like "Any Price" or "Both Indoor & Outdoor".
            </p>
            <button
              onClick={onRestart}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-3 rounded-full text-sm transition cursor-pointer"
            >
              Retake Survey
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {cafes.map((cafe, i) => (
              <motion.div
                key={cafe.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full bg-zinc-950">
                    <Image
                      src={cafe.image_url || '/images/home-bg.jpg'}
                      alt={cafe.name || 'Coffee Shop'}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    <div className="absolute top-3 left-3 bg-amber-500 text-zinc-950 font-black text-[10px] uppercase px-3 py-1 rounded-full shadow">
                      MATCH {i + 1}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{cafe.name}</h3>
                    {cafe.description && (
                      <p className="text-zinc-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                        "{getCleanDescription(cafe.description)}"
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-zinc-800 border border-white/10 text-amber-400 rounded-lg">
                        {cafe.price_level || cafe.price_range || '₱100-300'}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-zinc-800 border border-white/10 text-amber-400 rounded-lg">
                        {cafe.vibe || 'Social Catch-up'}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-zinc-800 border border-white/10 text-amber-400 rounded-lg">
                        {getCafeEnvironment(cafe)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href={`/cafe/${cafe.id}`}
                    className="block w-full text-center bg-white text-zinc-950 font-medium py-3 rounded-xl hover:bg-amber-500 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}