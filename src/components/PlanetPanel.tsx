'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useNavigation, PlanetId } from '@/context/NavigationContext';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  ArrowRight, 
  X,
  Mail,
  Award,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { track } from '@vercel/analytics';
import { recordResumeDownload, recordContactClick } from '@/lib/repositories/analytics';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function PlanetPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { data, selectedPlanet, travelState, isLoading } = useNavigation();
  const [expandedExpId, setExpandedExpId] = useState<string | null>(null);

  const routePlanet = useMemo(() => {
    const match = pathname?.match(/\/planet\/([a-z]+)/);
    if (match) {
      const p = match[1] as PlanetId;
      const validPlanets: PlanetId[] = ['core', 'education', 'skills', 'experience', 'achievements', 'contact'];
      if (validPlanets.includes(p)) return p;
    }
    return null;
  }, [pathname]);

  const activePlanet = selectedPlanet || routePlanet;

  // Show panel only when locked on a planet and flight is idle (landing complete)
  const showPanel = activePlanet !== null && activePlanet !== 'space' && travelState === 'idle';

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('a') && !target.closest('input') && !target.closest('select')) {
          router.push('/');
        }
      }
    };

    if (showPanel) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel, router]);

  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 100 }
    },
    exit: { 
      x: '100%', 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  } as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 140 } }
  } as const;

  // Skeleton placeholder for panel content while Firestore hydrates
  const renderSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-2/3 bg-zinc-800 rounded-lg" />
      <div className="h-4 w-1/2 bg-zinc-800/60 rounded-md" />
      <div className="space-y-2 pt-2">
        <div className="h-4 w-full bg-zinc-800/60 rounded-md" />
        <div className="h-4 w-5/6 bg-zinc-800/60 rounded-md" />
        <div className="h-4 w-4/6 bg-zinc-800/60 rounded-md" />
      </div>
      <div className="space-y-4">
        <div className="h-16 w-full bg-zinc-800/40 rounded-xl" />
        <div className="h-16 w-full bg-zinc-800/40 rounded-xl" />
      </div>
      <div className="h-10 w-full bg-zinc-800 rounded-xl mt-4" />
    </div>
  );

  const renderContent = () => {
    if (!activePlanet) return null;

    switch (activePlanet) {
      case 'core':
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={itemVariants} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.profile.avatar || "/avatar-fallback.jpg"} alt={data.profile.name} className="w-full h-full object-cover" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">{data.profile.name}</h1>
              <p className="text-sm font-medium text-blue-400">{data.profile.title}</p>
            </motion.div>

            <motion.p variants={itemVariants} className="text-zinc-300 text-sm leading-relaxed italic border-l-2 border-zinc-850 pl-3">
              &ldquo;{data.profile.tagline}&rdquo;
            </motion.p>

            <motion.div variants={itemVariants} className="text-zinc-400 text-sm leading-relaxed font-light">
              {data.profile.bio}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-2.5 pt-2">
              {data.profile.resume_url && (
                <a 
                  href={data.profile.resume_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                  onClick={() => {
                    recordResumeDownload();
                    try {
                      track('resume_download_main');
                    } catch (err) {
                      console.error("Vercel Analytics track resume_download_main failed:", err);
                    }
                  }}
                >
                  <FileText className="w-4 h-4" />
                  View Resume
                </a>
              )}
              <button 
                onClick={() => router.push('/planet/education')}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-medium text-xs rounded-lg border border-zinc-800 transition-all flex items-center gap-1.5"
              >
                Start Exploring
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </motion.div>
        );

      case 'education':
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Education
              </h2>
              <p className="text-xs text-zinc-400">Academic background and credentials</p>
            </motion.div>

            <div className="space-y-4">
              {data.education.filter(e => e.is_visible).map((edu) => (
                <motion.div key={edu.id} variants={itemVariants} className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-4.5 space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">{edu.degree}</h3>
                      <div className="text-xs text-zinc-400 font-medium">{edu.institution}</div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {edu.duration}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">{edu.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="pt-2">
              <button 
                onClick={() => router.push('/planet/skills')}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                Travel to Skills
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </motion.div>
        );

      case 'skills':
        const categories = ['Programming', 'Frameworks', 'Automation', 'Database', 'Tools', 'Other'] as const;
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Skills & Tech Stack
              </h2>
              <p className="text-xs text-zinc-400">Core engineering competencies</p>
            </motion.div>

            <div className="space-y-5 max-h-[52vh] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const catSkills = data.skills.filter(s => s.is_visible && s.category === cat);
                if (catSkills.length === 0) return null;
                return (
                  <motion.div key={cat} variants={itemVariants} className="space-y-2.5">
                    <h3 className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">{cat}</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {catSkills.map((s) => (
                        <div key={s.id} className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-3.5">
                          <div className="flex justify-between text-xs mb-2">
                            <span className="font-semibold text-zinc-200">{s.skill_name}</span>
                            <span className="font-mono text-zinc-400 font-bold">{s.proficiency}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                            <motion.div 
                              className="bg-violet-500 h-full shadow-[0_0_6px_rgba(139,92,246,0.3)]"
                              initial={{ width: 0 }}
                              animate={{ width: `${s.proficiency}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div variants={itemVariants} className="pt-2">
              <button 
                onClick={() => router.push('/planet/experience')}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                Travel to Experience
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </motion.div>
        );

      case 'experience':
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Work Experience
              </h2>
              <p className="text-xs text-zinc-400">Professional career history</p>
            </motion.div>

            <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
              {data.experience.filter(e => e.is_visible).map((exp) => (
                <motion.div 
                  key={exp.id} 
                  variants={itemVariants} 
                  onClick={() => setExpandedExpId(expandedExpId === exp.id ? null : exp.id)}
                  className={`bg-zinc-900/60 border rounded-xl p-4.5 space-y-3 cursor-pointer transition-all ${
                    expandedExpId === exp.id ? 'border-violet-500 bg-zinc-900/90 ring-1 ring-violet-500/20' : 'border-zinc-850 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {exp.role}
                        <span className="text-[9px] text-zinc-550 font-mono font-light bg-zinc-800/40 border border-zinc-850/65 px-1.5 py-0.5 rounded leading-none shrink-0">
                          {expandedExpId === exp.id ? 'Collapse ▲' : 'Details ▼'}
                        </span>
                      </h3>
                      <div className="text-xs font-semibold text-blue-400 mt-1">{exp.company}</div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/50 border border-zinc-850 px-2 py-0.5 rounded uppercase font-bold">
                      {exp.duration}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {expandedExpId === exp.id ? (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden space-y-3 pt-1"
                      >
                        <p className="text-xs text-zinc-300 font-light leading-relaxed">{exp.description}</p>

                        {/* Impact metrics list */}
                        {exp.metrics && exp.metrics.length > 0 && (
                          <div className="space-y-1.5 pt-1.5 border-t border-zinc-900">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Project Value & Deliverables</h4>
                            <ul className="list-none text-xs text-zinc-400 space-y-1.5">
                              {exp.metrics.map((metric, mIdx) => (
                                <li key={mIdx} className="flex items-start gap-2 font-light">
                                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                                  <span className="flex-1 leading-normal text-zinc-300">{metric}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tech stack tags */}
                        {exp.tech_stack && exp.tech_stack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {exp.tech_stack.map((tech) => (
                              <span key={tech} className="text-[9px] font-mono font-medium text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-850 uppercase">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <p className="text-xs text-zinc-450 font-light truncate leading-normal">{exp.description}</p>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="pt-2">
              <button 
                onClick={() => router.push('/planet/achievements')}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                Travel to Achievements
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </motion.div>
        );

      case 'achievements':
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Achievements
              </h2>
              <p className="text-xs text-zinc-400">Awards, credentials and certifications</p>
            </motion.div>

            <div className="space-y-3.5 max-h-[52vh] overflow-y-auto pr-1">
              {data.achievements.filter(a => a.is_visible).map((ach) => (
                <motion.div key={ach.id} variants={itemVariants} className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl flex gap-3.5 items-start">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-xs md:text-sm font-bold text-white leading-tight">{ach.title}</h3>
                      <span className="text-[9px] font-mono text-amber-400 font-bold whitespace-nowrap">{ach.date}</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">{ach.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="pt-2">
              <button 
                onClick={() => router.push('/planet/contact')}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                Travel to Contact
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </motion.div>
        );

      case 'contact':
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Contact Terminal
              </h2>
              <p className="text-xs text-zinc-400">Establish a communication link</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Email Address</span>
                  <a 
                    href={`mailto:${data.contact.email}`} 
                    onClick={recordContactClick}
                    className="text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1"
                  >
                    {data.contact.email}
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </div>
                 <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">LinkedIn</span>
                  <a 
                    href={data.contact.linkedin} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={recordContactClick}
                    className="text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5 text-zinc-400 hover:text-white transition-colors" />
                    {data.contact.linkedin ? data.contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '/in/') : '/in/aditi-mallick'}
                  </a>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">GitHub</span>
                  <a 
                    href={data.contact.github} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={recordContactClick}
                    className="text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5"
                  >
                    <GithubIcon className="w-3.5 h-3.5 text-zinc-400 hover:text-white transition-colors" />
                    {data.contact.github ? data.contact.github.replace(/^https?:\/\/(www\.)?github\.com\/?/, '@') : '@aditimallick'}
                  </a>
                </div>
                {Object.entries(data.contact.socials || {}).map(([key, val]) => {
                  const isPhone = key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile') || key.toLowerCase().includes('tel');
                  const hrefValue = isPhone ? `tel:${val.replace(/\s+/g, '')}` : val;
                  const displayValue = val.length > 30 ? val.replace(/^https?:\/\/(www\.)?/, '').substring(0, 25) + '...' : val;
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">{key}</span>
                      <a 
                        href={hrefValue} 
                        target={isPhone ? "_self" : "_blank"} 
                        rel="noreferrer" 
                        onClick={recordContactClick}
                        className="text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1"
                      >
                        {displayValue}
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-2 pt-2">
              <a 
                href={`mailto:${data.contact.email}`}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm text-center pointer-events-auto"
                onClick={() => {
                  recordContactClick();
                  try {
                    track('contact_email');
                  } catch (err) {
                    console.error("Vercel Analytics track contact_email failed:", err);
                  }
                }}
              >
                <Mail className="w-4 h-4" />
                Initiate Quantum Mail
              </a>
              <button 
                onClick={() => router.push('/')}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                Return to Orbit
              </button>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {showPanel && (
        <motion.div 
          ref={panelRef}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed top-20 right-4 bottom-28 md:bottom-6 w-[calc(100%-2rem)] md:w-[460px] max-w-full bg-zinc-950/90 border border-zinc-850 backdrop-blur-xl rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.8)] p-6 z-30 select-none overflow-y-auto flex flex-col justify-between"
        >
          {/* Close Panel Button */}
          <button 
            onClick={() => router.push('/')}
            className="absolute top-4.5 right-4.5 p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-transparent hover:border-zinc-800 transition-all pointer-events-auto cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Dynamic Content */}
          <div className="flex-1 mt-3">
            {isLoading ? renderSkeleton() : renderContent()}
          </div>

          {/* Footer security badge */}
          <div className="mt-8 border-t border-zinc-800/80 pt-4.5 flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              verified recruiter link
            </span>
            <span>cv-2026-v2</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
