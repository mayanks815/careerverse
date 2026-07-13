'use client';

import React, { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { FileText, Download, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import { recordResumeDownload } from '@/lib/repositories/analytics';

export default function ResumeCapsule() {
  const { data, currentPlanet, travelState, isLoading } = useNavigation();
  const pathname = usePathname();
  const [showErrorTooltip, setShowErrorTooltip] = useState(false);

  if (pathname?.startsWith('/mission-control')) return null;

  // Hide the capsule when viewing detail panels to keep the screen clean,
  // except on the Core Planet itself where it fits.
  const isPanelOpen = currentPlanet !== 'space' && currentPlanet !== 'core' && travelState === 'idle';

  if (isPanelOpen) return null;

  const hasResume = !!data.profile.resume_url;

  const handleClick = (e: React.MouseEvent) => {
    if (!hasResume) {
      e.preventDefault();
      setShowErrorTooltip(true);
      setTimeout(() => setShowErrorTooltip(false), 3000);
      return;
    }
    
    recordResumeDownload();
    try {
      track('resume_download_capsule');
    } catch (err) {
      console.error("Vercel Analytics track resume_download_capsule failed:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="fixed bottom-24 right-4 md:bottom-6 md:left-6 md:right-auto z-30 pointer-events-auto select-none"
    >
      <div className="relative">
        <AnimatePresence>
          {showErrorTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: -10 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] font-sans leading-normal text-zinc-300 shadow-2xl flex items-start gap-2 z-50"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">No CV PDF Uploaded</span>
                <p className="mt-0.5 text-zinc-400 font-light">Set your resume URL or upload a file in Mission Control.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <a
          href={hasResume ? data.profile.resume_url : '#'}
          target={hasResume ? "_blank" : "_self"}
          rel="noreferrer"
          onClick={handleClick}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border bg-zinc-950/90 text-xs font-semibold transition-all shadow-2xl cursor-pointer group ${
            hasResume 
              ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-200' 
              : 'border-zinc-850 opacity-60 text-zinc-500 hover:border-zinc-800'
          }`}
        >
          {isLoading ? (
            <div className="w-2.5 h-2.5 rounded-full border border-t-transparent border-blue-400 animate-spin" />
          ) : (
            <div className="relative flex items-center justify-center">
              <span className={`absolute inline-flex h-2 w-2 rounded-full opacity-75 ${hasResume ? 'bg-blue-500 animate-ping' : 'bg-zinc-600'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${hasResume ? 'bg-blue-500' : 'bg-zinc-600'}`} />
            </div>
          )}
          <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
          <span>{hasResume ? 'Resume PDF' : 'CV Missing'}</span>
          {hasResume && <Download className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />}
        </a>
      </div>
    </motion.div>
  );
}
