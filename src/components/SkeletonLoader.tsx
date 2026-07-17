'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

const TIPS = [
  "Warm-starting warp injectors...",
  "Aligning asteroid coordinate belts...",
  "Calibrating system HUD dashboard...",
  "Establishing encrypted Firebase uplink...",
  "Decrypting orbital terminal nodes..."
];

export default function SkeletonLoader() {
  const [percent, setPercent] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-space-black flex flex-col items-center justify-center z-20 select-none">
      {/* Glow effect backings */}
      <div className="absolute w-96 h-96 rounded-full bg-neon-blue/5 blur-[80px]" />
      <div className="absolute w-96 h-96 rounded-full bg-neon-purple/5 blur-[120px]" />

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        
        {/* Holographic orbital loader */}
        <div className="relative w-20 h-20 flex items-center justify-center border border-white/5 rounded-full p-2 bg-white/2">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-neon-blue/30 animate-spin-slow" />
          <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
        </div>

        {/* Console loading details */}
        <div className="space-y-2">
          <h2 className="text-sm font-mono text-white font-bold tracking-widest uppercase">
            CONNECTING TO ADITI MALLICK
          </h2>
          <div className="text-[10px] font-mono text-neon-blue h-4 overflow-hidden">
            {TIPS[tipIndex]}
          </div>
        </div>

        {/* High-tech progress bar */}
        <div className="w-64 space-y-1.5">
          <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold">
            <span>UPLINK SPEED: 9.8 GB/S</span>
            <span>{Math.min(100, percent)}%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-neon-blue to-neon-purple h-full shadow-[0_0_8px_#00d2ff] transition-all duration-150"
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
        </div>

        {/* Security watermark */}
        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase tracking-widest pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-neon-emerald" />
          Quantum handshake complete
        </div>
      </div>
    </div>
  );
}
