'use client';

import React, { useEffect, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { motion, AnimatePresence } from 'framer-motion';

interface WarpLine {
  id: number;
  top: number; // percentage
  left: number; // percentage
  width: number; // width in pixels
  duration: number; // duration of movement in seconds
  delay: number; // delay before start
  color: string;
}

export default function WarpEffect() {
  const { travelState, reducedMotion } = useNavigation();
  const [lines, setLines] = useState<WarpLine[]>([]);

  const isWarping = travelState === 'warping';

  useEffect(() => {
    if (!isWarping || reducedMotion) {
      setLines([]);
      return;
    }

    // Generate random warp lines on the fly
    const generated: WarpLine[] = Array.from({ length: 40 }).map((_, i) => {
      const colors = [
        'bg-white',
        'bg-neon-blue',
        'bg-neon-purple',
        'bg-cyan-200',
        'bg-indigo-300'
      ];
      return {
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 20 - 10, // starts offscreen left
        width: Math.random() * 200 + 100, // length of streak
        duration: Math.random() * 0.4 + 0.2, // fast slide speed
        delay: Math.random() * 0.6, // random staggered delays
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });

    setLines(generated);
  }, [isWarping, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <AnimatePresence>
      {isWarping && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/40 z-50 pointer-events-none overflow-hidden"
        >
          {/* Flash bloom container */}
          <div className="absolute inset-0 bg-gradient-radial from-neon-blue/10 via-space-black/50 to-space-black opacity-60" />

          {/* Stretched warp line meshes */}
          {lines.map((line) => (
            <motion.div
              key={line.id}
              className={`absolute h-[1px] md:h-[2px] rounded-full opacity-0 ${line.color} shadow-[0_0_8px_rgba(0,210,255,0.6)]`}
              style={{
                top: `${line.top}%`,
                width: `${line.width}px`
              }}
              initial={{ left: '-20%', opacity: 0, scaleX: 0.1 }}
              animate={{ 
                left: '120%', 
                opacity: [0, 0.9, 0.9, 0],
                scaleX: [0.1, 2, 2, 0.1]
              }}
              transition={{
                duration: line.duration,
                delay: line.delay,
                ease: 'easeInOut',
                repeat: Infinity
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
