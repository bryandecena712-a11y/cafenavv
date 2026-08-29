import { prisma } from '@/app/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import StoriesBar from './components/StoriesBar';
import CafeDirectory from './components/CafeDirectory';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cafes = await prisma.cafes.findMany({
    where: { status: 'APPROVED' }
  });

  return (
    <main className="flex-1 flex flex-col bg-zinc-950 text-zinc-50 overflow-hidden relative">
      {/* Hero Section */}
      <section className="relative w-full pt-32 pb-24 lg:pt-48 lg:pb-32">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center relative z-10">
          <div className="flex flex-col items-start lg:col-span-6 xl:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium tracking-wide text-zinc-400 mb-8">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Find your next favorite spot
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.05] text-zinc-50 mb-6 text-balance">
              Lost in the <br />
              <span className="text-zinc-500 italic">daily grind?</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-10 max-w-md text-balance leading-relaxed">
              Let us guide you to great coffee. Discover, rate, and match with the perfect local coffee shops designed around how you like to spend your time.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                href="/offers" 
                className="bg-amber-500 text-zinc-950 font-medium px-8 py-3.5 rounded-full hover:bg-amber-400 hover:-translate-y-[1px] active:scale-[0.98] transition-all"
              >
                Take the Quiz
              </Link>
              <Link
                href="/suggest"
                className="bg-zinc-800 text-zinc-50 font-medium px-8 py-3.5 rounded-full hover:bg-zinc-700 hover:-translate-y-[1px] active:scale-[0.98] transition-all border border-zinc-700"
              >
                Suggest a Cafe
              </Link>
            </div>
          </div>
          
          {/* Right Asset - Asymmetric Image Layout */}
          <div className="lg:col-span-6 xl:col-span-7 relative h-[500px] lg:h-[600px] w-full mt-12 lg:mt-0">
            <div className="absolute inset-0 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 transform lg:rotate-2 hover:rotate-0 transition-transform duration-700 ease-out shadow-2xl">
              <Image
                src="/images/home-bg.jpg"
                alt="Coffee shop interior"
                fill
                className="object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/80 via-zinc-950/20 to-transparent pointer-events-none"></div>
              
              {/* Glassmorphism floating card */}
              <div className="absolute bottom-6 left-6 right-6 md:right-auto md:bottom-10 md:left-10 md:w-80 bg-zinc-950/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-2 duration-500">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden relative border-2 border-amber-500/50">
                    <Image src="/images/250cafe-real.jpg" alt="User rating" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">Perfect Match</div>
                    <div className="text-xs text-zinc-400 mt-1">Based on your quiz</div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Bar */}
      <StoriesBar cafes={cafes} />

      {/* Popular Cafes & Map Section */}
      <section className="w-full relative z-10 py-24 border-t border-zinc-900/50 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <CafeDirectory initialCafes={cafes} />
        </div>
      </section>
    </main>
  );
}
