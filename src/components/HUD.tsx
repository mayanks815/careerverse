'use client';

import React, { useState } from 'react';
import { useNavigation, PlanetId } from '@/context/NavigationContext';
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Activity, 
  Compass, 
  BookOpen, 
  Cpu, 
  Briefcase, 
  Award, 
  Send,
  Loader2,
  Sliders,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function HUD() {
  const router = useRouter();
  const pathname = usePathname();
  
  if (pathname?.startsWith('/mission-control')) {
    return null;
  }
  const {
    currentPlanet,
    targetPlanet,
    travelState,
    systemLogs,
    soundMuted,
    setSoundMuted,
    reducedMotion,
    setReducedMotion,
    explorationProgress,
    isLoading,
    cancelTravel
  } = useNavigation();

  const [showConsole, setShowConsole] = useState(false);

  const planetsList: { id: PlanetId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'core', label: 'Core', icon: <Compass className="w-3.5 h-3.5" />, color: 'border-blue-500/40 text-blue-400' },
    { id: 'education', label: 'Education', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'border-emerald-500/40 text-emerald-400' },
    { id: 'skills', label: 'Skills', icon: <Cpu className="w-3.5 h-3.5" />, color: 'border-violet-500/40 text-violet-400' },
    { id: 'experience', label: 'Experience', icon: <Briefcase className="w-3.5 h-3.5" />, color: 'border-blue-500/40 text-blue-400' },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-3.5 h-3.5" />, color: 'border-amber-500/40 text-amber-400' },
    { id: 'contact', label: 'Contact', icon: <Send className="w-3.5 h-3.5" />, color: 'border-rose-500/40 text-rose-400' }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none flex flex-col justify-between p-4 md:p-6">
      
      {/* TOP BAR */}
      <div className="w-full flex items-start justify-between pointer-events-auto">
        <div className="flex flex-col space-y-2">
          {/* Main Status bar */}
          <div className="bg-zinc-950/75 border border-zinc-800/80 backdrop-blur-md rounded-xl p-3.5 pr-5 flex items-center gap-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
              <div>
                <div className="text-[10px] text-zinc-500 font-mono tracking-wider font-bold uppercase">System Link</div>
                <div className="text-xs font-semibold text-white tracking-tight">
                  {travelState !== 'idle' ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                      Traveling to {targetPlanet}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelTravel();
                        }}
                        className="ml-2 px-1.5 py-0.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 hover:border-red-700/60 text-[9px] font-bold text-red-400 hover:text-white rounded uppercase tracking-wider transition-colors cursor-pointer"
                        title="Cancel flight trajectory"
                      >
                        Abort
                      </button>
                    </span>
                  ) : currentPlanet === 'space' ? (
                    'Deep Space Orbit'
                  ) : (
                    <span>Landed at {currentPlanet}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-zinc-800" />

            <div className="text-left">
              <div className="text-[10px] text-zinc-500 font-mono tracking-wider font-bold uppercase">Explored</div>
              <div className="text-xs font-semibold text-white font-mono">{explorationProgress}%</div>
            </div>

            <div className="h-6 w-px bg-zinc-800" />

            {/* Micro Diagnostic Console Dot */}
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="relative p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Telemetry Diagnostics"
            >
              <Activity className="w-3.5 h-3.5" />
              {systemLogs.length > 0 && !isLoading && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Minimal Diagnostic Console Dropdown */}
          {showConsole && (
            <div className="w-80 bg-zinc-950/95 border border-zinc-800/80 backdrop-blur-md rounded-xl shadow-2xl p-3 overflow-hidden text-left flex flex-col gap-2 animate-[fadeIn_0.15s_ease-out]">
              <div className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/80 pb-1.5 flex justify-between">
                <span>System Logs & Telemetry</span>
                <span className="text-blue-400">Online</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-[9px] text-zinc-400">
                {isLoading ? (
                  <div className="text-blue-400 animate-pulse">&gt; Uplink loading...</div>
                ) : (
                  systemLogs.map((log) => (
                    <div key={log.id} className="flex gap-1.5 items-start">
                      <span className="text-zinc-600 font-normal">[{log.timestamp}]</span>
                      <span className="flex-1 leading-normal font-medium">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* TOP RIGHT PREFERENCES */}
        <div className="flex items-center gap-1.5 bg-zinc-950/75 border border-zinc-800/80 backdrop-blur-md p-1.5 rounded-xl shadow-xl">
          <Link 
            href="/mission-control" 
            className="text-[11px] font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all font-sans"
          >
            Mission Control
          </Link>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Motion Toggle */}
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title={reducedMotion ? 'Enable Immersive Flight' : 'Enable Reduced Motion'}
          >
            {reducedMotion ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* BOTTOM NAV BAR */}
      <div className="w-full flex flex-col items-center pointer-events-auto gap-3">
        {currentPlanet !== 'space' && travelState === 'idle' && (
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-950/90 hover:bg-zinc-900 text-xs font-semibold text-zinc-200 cursor-pointer transition-all shadow-xl flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            Return to Orbit
          </button>
        )}

        <div className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md p-1.5 rounded-2xl flex items-center justify-center gap-1 max-w-full overflow-x-auto shadow-2xl">
          {planetsList.map((p) => {
            const isActive = currentPlanet === p.id || targetPlanet === p.id;
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/planet/${p.id}`)}
                disabled={travelState !== 'idle'}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold font-sans border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-zinc-800 text-white border-zinc-700 shadow-inner'
                    : 'bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
