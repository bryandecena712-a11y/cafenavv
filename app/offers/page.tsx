'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle } from '@phosphor-icons/react';

export default function Offers() {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});

  const startQuiz = () => setStep(1);
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);
  
  const handleSelect = (optionTitle: string) => {
    setSelections({ ...selections, [step]: optionTitle });
  };

  const currentSelection = selections[step];

  const quizData = [
    {
      title: "What are you drinking?",
      category: "COFFEE TYPE",
      options: [
        { title: "Pour Over", desc: "Clean, nuanced, filter coffee" },
        { title: "Espresso", desc: "Strong, concentrated shot" },
        { title: "Milk Based", desc: "Latte, flat white, cappuccino" },
        { title: "Not Coffee", desc: "Matcha, tea, hot chocolate" }
      ]
    },
    {
      title: "What do you need there?",
      category: "NEEDS",
      options: [
        { title: "Deep Work", desc: "Quiet, fast wifi, outlets" },
        { title: "Social Catch-up", desc: "Lively, good acoustics, spacious" },
        { title: "Quick Grab", desc: "Fast service, standing room" },
        { title: "Reading/Chill", desc: "Cozy seating, natural light" }
      ]
    },
    {
      title: "Which price fits you?",
      category: "PRICE RANGE",
      options: [
        { title: "₱ (Affordable)", desc: "Daily driver coffee" },
        { title: "₱₱ (Moderate)", desc: "Specialty beans, standard price" },
        { title: "₱₱₱ (Premium)", desc: "Geisha beans, high-end experience" }
      ]
    }
  ];

  if (step === 0) {
    return (
      <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
        <Image src="/images/home-bg.jpg" alt="Coffee shop" fill className="object-cover opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        
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
            Answer three quick questions about what you look for in a coffee shop — we'll match you to spaces that suit how you like to spend your time.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={startQuiz} 
            className="bg-amber-600 text-white px-10 py-4 rounded-full font-medium tracking-wide hover:bg-amber-500 active:scale-95 transition-all"
          >
            Start Matchmaker
          </motion.button>
        </div>
      </main>
    );
  }

  if (step >= 1 && step <= 3) {
    const data = quizData[step - 1];
    const isGrid3 = data.options.length === 3;

    return (
      <main className="flex-1 flex flex-col bg-stone-50">
        <div className="max-w-4xl mx-auto w-full px-6 py-12 flex-1 flex flex-col">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between text-sm font-medium text-zinc-500 mb-4">
              <button onClick={prevStep} className="hover:text-zinc-900 transition-colors">&larr; Back</button>
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
                  const isSelected = currentSelection === opt.title;
                  return (
                    <button
                      key={opt.title}
                      onClick={() => handleSelect(opt.title)}
                      className={`text-left p-6 rounded-2xl border-2 transition-all ${
                        isSelected 
                          ? 'border-zinc-900 bg-zinc-900 shadow-lg' 
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                          {opt.title}
                        </h3>
                        {isSelected && <CheckCircle size={24} weight="fill" className="text-amber-500" />}
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
                  className="w-full md:w-auto md:min-w-[200px] bg-zinc-950 disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-medium py-4 px-8 rounded-full transition-all hover:bg-zinc-800 disabled:hover:bg-zinc-300 active:scale-95"
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

  // Results Page
  if (step === 4) {
    return <ResultsView selections={selections} />;
  }

  return null;
}

function ResultsView({ selections }: { selections: Record<number, string> }) {
  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // selections[2] is Needs (Vibe)
    // selections[3] is Price
    const vibe = selections[2] || '';
    const price = selections[3] || '';
    
    fetch(`/api/cafes?vibe=${encodeURIComponent(vibe)}&price=${encodeURIComponent(price)}`)
      .then(res => res.json())
      .then(data => {
        setCafes(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex-1 flex flex-col bg-zinc-950 text-stone-50">
      <div className="max-w-6xl mx-auto px-6 py-20 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Your personalized matches</h1>
          <div className="flex items-center gap-3 text-amber-500 font-medium">
            <CheckCircle size={20} weight="fill" />
            <span>Algorithm found {cafes.length} perfect matches based on your preferences.</span>
          </div>
        </motion.div>

        {loading ? (
           <div className="text-zinc-500 animate-pulse">Analyzing matches...</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {cafes.map((cafe, i) => (
              <motion.div
                key={cafe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="group relative bg-zinc-900 rounded-3xl overflow-hidden"
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image src={cafe.image_url || '/images/home-bg.jpg'} alt={cafe.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 w-full p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2 block">Match {i + 1}</span>
                    <h3 className="text-2xl font-bold mb-2">{cafe.name}</h3>
                    <p className="text-zinc-300 text-sm mb-6 leading-relaxed line-clamp-1">{cafe.address}</p>
                    <button className="w-full bg-white text-zinc-950 font-medium py-3 rounded-xl hover:bg-zinc-200 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
