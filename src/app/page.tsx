'use client';

import React from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, Navigation } from 'lucide-react';

export default function Home() {
  const { currentPlanet, travelState } = useNavigation();
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
            {/* Soft decorative star icon */}
            <div className="inline-flex p-2 bg-neon-blue/10 border border-neon-blue/20 rounded-full text-neon-blue mb-1 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-widest text-white uppercase font-sans">
                CAREERVERSE
              </h1>
              <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-neon-blue to-transparent mx-auto" />
              <p className="text-xs md:text-sm font-mono text-slate-400 uppercase tracking-widest leading-relaxed">
                Immersive Space-Themed Professional Portfolio
              </p>
            </div>

            <p className="text-slate-300 text-xs md:text-sm font-light leading-relaxed max-w-md mx-auto">
              Explore different coordinate systems to review academic milestones, skills satellite charts, career milestones, achievements, and contact pathways.
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
