'use client';

import React from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Navigation } from 'lucide-react';

export default function Home() {
  const { currentPlanet, travelState, data } = useNavigation();
  const router = useRouter();

  // Only show the central landing overlay when in outer space view and not warping
  const showIntro = currentPlanet === 'space' && travelState === 'idle';

  return (
    <AnimatePresence>
      {showIntro && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-xl px-6 space-y-6 pointer-events-auto"
          >
            {/* Soft decorative star icon or Avatar if configured */}
            {data?.profile?.avatar ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative mx-auto w-24 h-24 md:w-28 md:h-28 rounded-full p-1 bg-zinc-950/40 border border-white/10 backdrop-blur-md shadow-2xl mb-4 select-none pointer-events-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={data.profile.avatar} 
                  alt={data.profile.name} 
                  loading="lazy"
                  className="w-full h-full rounded-full object-cover object-center border border-white/5" 
                />
                <div className="absolute inset-0 rounded-full border border-white/10" />
              </motion.div>
            ) : (
              <div className="inline-flex p-2 bg-neon-blue/10 border border-neon-blue/20 rounded-full text-neon-blue mb-1 animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
            )}

            <div className="space-y-3.5">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest text-white uppercase font-sans">
                {data?.profile?.name || 'Aditi Mallick'}
              </h1>
              <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-neon-blue to-transparent mx-auto" />
              <p className="text-xs md:text-sm font-mono text-neon-blue uppercase tracking-widest leading-relaxed font-semibold">
                {data?.profile?.title || 'Software Engineer'}
              </p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-full text-[10px] font-mono text-zinc-400 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
                <span>Current Company: <strong className="text-zinc-200">Samsung Electro-Mechanics</strong></span>
              </div>
            </div>

            <p className="text-slate-300 text-xs md:text-sm font-light leading-relaxed max-w-lg mx-auto">
              Designing scalable software solutions with a focus on performance, automation and user experience.
            </p>

            <div className="pt-4">
              <button
                onClick={() => router.push('/planet/core')}
                className="px-8 py-3.5 bg-black/60 hover:bg-neon-blue/20 border border-neon-blue text-xs font-mono font-bold tracking-widest text-neon-blue hover:text-white rounded-md transition-all shadow-[0_0_15px_rgba(0,210,255,0.1)] glow-blue flex items-center gap-2.5 mx-auto cursor-pointer group"
              >
                <Navigation className="w-4 h-4 group-hover:translate-x-1 group-translate-y-1 transition-transform" />
                INITIATE LAUNCH SEQUENCE
              </button>
            </div>
            
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse pt-2">
              System locks: Core system ready
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
