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

  const resumeUrl = data?.profile?.resume_url || "https://drive.google.com/file/d/1V-Mt0mwd0c8uTQqYpGLs1uuO4vJp_9iu/view?usp=sharing";

  const handleClick = (e: React.MouseEvent) => {
    console.log("Resume button clicked in ResumeCapsule");
    e.stopPropagation();
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

      <div className="flex items-center p-1.5 bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-md rounded-full shadow-2xl">
        <a
          href={resumeUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-zinc-800/80 text-[11px] font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer group"
        >
          {isLoading ? (
            <div className="w-2.5 h-2.5 rounded-full border border-t-transparent border-blue-400 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-zinc-450 group-hover:text-blue-400 transition-colors" />
          )}
          <span>Resume</span>
        </a>
      </div>
      </div>
    </motion.div>
  );
}
