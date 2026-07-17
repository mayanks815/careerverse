'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useContent } from '@/context/ContentProvider';
import { CareerverseData } from '@/lib/mockData';
import { 
  playSynthClick, 
  playSynthWarp, 
  playSynthLanding, 
  startAmbientSpaceDrone, 
  stopAmbientSpaceDrone 
} from '@/lib/audio';
import { track } from '@vercel/analytics';
import { recordVisitor, recordPlanetVisit, recordSessionDuration } from '@/lib/repositories/analytics';

export type PlanetId = 'core' | 'education' | 'skills' | 'experience' | 'achievements' | 'resume' | 'contact' | 'space';

export type TravelState = 'idle' | 'aligning' | 'warping' | 'landing';

interface SystemLog {
  id: string;
  message: string;
  timestamp: string;
}

interface NavigationContextType {
  currentPlanet: PlanetId;
  targetPlanet: PlanetId | null;
  travelState: TravelState;
  visitedPlanets: PlanetId[];
  soundMuted: boolean;
  reducedMotion: boolean;
  systemLogs: SystemLog[];
  data: CareerverseData;
  isLoading: boolean;
  selectedPlanet: PlanetId | null;
  setSelectedPlanet: (planet: PlanetId | null) => void;
  activePanel: PlanetId | null;
  setActivePanel: (planet: PlanetId | null) => void;
  setSoundMuted: (muted: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  travelTo: (planet: PlanetId) => void;
  resetToSpace: () => void;
  addLog: (msg: string) => void;
  explorationProgress: number;
  cancelTravel: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Core navigation state
  const [currentPlanet, setCurrentPlanet] = useState<PlanetId>('space');
  const [targetPlanet, setTargetPlanet] = useState<PlanetId | null>(null);
  const [travelState, setTravelState] = useState<TravelState>('idle');
  const [visitedPlanets, setVisitedPlanets] = useState<PlanetId[]>([]);

  // Parse path immediately to hydrate selected planet state before render
  const initialPlanet = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const match = window.location.pathname.match(/\/planet\/([a-z]+)/);
    if (match) {
      const p = match[1] as PlanetId;
      const validPlanets: PlanetId[] = ['core', 'education', 'skills', 'experience', 'achievements', 'resume', 'contact'];
      if (validPlanets.includes(p)) return p;
    }
    return null;
  }, []);

  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(initialPlanet);
  const [activePanel, setActivePanel] = useState<PlanetId | null>(initialPlanet);
  
  const travelTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  // HUD Preferences
  const [soundMuted, setSoundMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  // Data loading state from ContentProvider
  const { data, isLoading, error } = useContent();

  // Helper to add timestamped system logs
  const addLog = (message: string) => {
    const log: SystemLog = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setSystemLogs(prev => [log, ...prev].slice(0, 15)); // Keep last 15 logs
  };

  // System telemetry log sync
  useEffect(() => {
    if (isLoading) {
      addLog("Initializing database sync...");
    } else {
      if (error) {
        addLog(`Database offline: ${error}`);
      } else {
        addLog("Database sync complete. Status: ONLINE");
      }
    }
  }, [isLoading, error]);

  // Track session duration dynamically
  useEffect(() => {
    const startTime = Date.now();
    const handleBeforeUnload = () => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      recordSessionDuration(durationSeconds);
      try {
        track('session_duration', { durationSeconds });
      } catch (err) {
        console.error("Vercel Analytics track session duration failed:", err);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Record visitor count on mount
  useEffect(() => {
    recordVisitor();
  }, []);


  // 1. travelTo: Route pushing only (with pathname guard)
  const travelTo = useCallback((planet: PlanetId) => {
    if (pathname !== `/planet/${planet}`) {
      router.push(`/planet/${planet}`);
    }
  }, [router, pathname]);

  // 2. resetToSpace: Route pushing only (with pathname guard)
  const resetToSpace = useCallback(() => {
    if (pathname !== '/') {
      router.push('/');
    }
  }, [router, pathname]);

  // 3. executeTravel: Animation logic execution only
  const executeTravel = useCallback((planet: PlanetId) => {
    // Guards: Prevent double triggers if already at target or already in motion
    if (planet === currentPlanet || targetPlanet !== null || travelState !== 'idle') return;

    // Play interaction click sound
    playSynthClick(soundMuted);

    // Tracking analytics
    try {
      track('planet_visit', { planet });
    } catch (err) {
      console.error("Vercel Analytics track planet_visit failed:", err);
    }

    setTargetPlanet(planet);
    recordPlanetVisit(planet);

    // If reduced motion is active, skip cinematic camera curves & warping
    if (reducedMotion) {
      addLog(`Teleporting to ${planet.toUpperCase()} planet...`);
      setTravelState('landing');
      setCurrentPlanet(planet);
      setSelectedPlanet(planet);
      setActivePanel(planet);
      setTargetPlanet(null);
      setTravelState('idle');
      
      // Play landing sound feedback
      playSynthLanding(soundMuted);

      // Update visited tracking
      if (planet !== 'space' && !visitedPlanets.includes(planet)) {
        setVisitedPlanets(prev => [...prev, planet]);
      }
      
      addLog(`Status: Landed at ${planet.toUpperCase()}`);
      return;
    }

    // Normal cinematic travel flow
    addLog(`Initiating flight path to ${planet.toUpperCase()} coordinates...`);
    setTravelState('aligning');

    // Clear any leftover timeouts
    travelTimeoutsRef.current.forEach(clearTimeout);
    travelTimeoutsRef.current = [];

    // Sequence timing
    // Step 1: Align ship (0.8s)
    const t1 = setTimeout(() => {
      setTravelState('warping');
      addLog("Warp drive engaged. Folding space-time...");
      
      // Play warp synth sound
      playSynthWarp(soundMuted);

      // Step 2: Warp visual streak duration (1.5s)
      const t2 = setTimeout(() => {
        setTravelState('landing');
        setCurrentPlanet(planet);
        addLog(`Orbit reached. Executing atmospheric landing at ${planet.toUpperCase()}...`);
        
        // Play landing synth sound
        playSynthLanding(soundMuted);

        // Step 3: Landing finish & open UI (1.0s)
        const t3 = setTimeout(() => {
          setTravelState('idle');
          setTargetPlanet(null);
          setCurrentPlanet(planet);
          setSelectedPlanet(planet);
          setActivePanel(planet);
          addLog(`Status: Landed at ${planet.toUpperCase()} system.`);
          
          if (planet !== 'space' && !visitedPlanets.includes(planet)) {
            setVisitedPlanets(prev => [...prev, planet]);
          }
          travelTimeoutsRef.current = [];
        }, 1000);
        travelTimeoutsRef.current.push(t3);
      }, 1500);
      travelTimeoutsRef.current.push(t2);
    }, 800);
    travelTimeoutsRef.current.push(t1);
  }, [currentPlanet, targetPlanet, travelState, soundMuted, reducedMotion, visitedPlanets]);

  // 4. executeResetToSpace: Thruster escape animation logic execution only
  const executeResetToSpace = useCallback(() => {
    // Guards: Prevent returning if already in space or already in motion
    if (currentPlanet === 'space' || targetPlanet !== null || travelState !== 'idle') return;

    // Play click sound
    playSynthClick(soundMuted);

    if (reducedMotion) {
      addLog("Returning to space orbit...");
      setCurrentPlanet('space');
      setSelectedPlanet(null);
      setActivePanel(null);
      setTargetPlanet(null);
      setTravelState('idle');
      playSynthLanding(soundMuted);
      return;
    }

    addLog("Igniting escape thrusters...");
    setTravelState('aligning');
    setTargetPlanet('space');

    // Clear any leftover timeouts
    travelTimeoutsRef.current.forEach(clearTimeout);
    travelTimeoutsRef.current = [];

    const t1 = setTimeout(() => {
      setTravelState('warping');
      addLog("Warping back to central galactic view...");
      
      playSynthWarp(soundMuted);

      const t2 = setTimeout(() => {
        setTravelState('landing');
        setCurrentPlanet('space');
        
        playSynthLanding(soundMuted);

        const t3 = setTimeout(() => {
          setTravelState('idle');
          setTargetPlanet(null);
          setCurrentPlanet('space');
          setSelectedPlanet(null);
          setActivePanel(null);
          addLog("Status: Orbiting space view.");
          travelTimeoutsRef.current = [];
        }, 800);
        travelTimeoutsRef.current.push(t3);
      }, 1000);
      travelTimeoutsRef.current.push(t2);
    }, 600);
    travelTimeoutsRef.current.push(t1);
  }, [currentPlanet, targetPlanet, travelState, soundMuted, reducedMotion]);

  // 5. cancelTravel: Cancel active travel animation
  const cancelTravel = useCallback(() => {
    if (travelState === 'idle') return;
    
    // Clear active timeouts
    travelTimeoutsRef.current.forEach(clearTimeout);
    travelTimeoutsRef.current = [];
    
    setTravelState('idle');
    setTargetPlanet(null);
    setSelectedPlanet(null);
    setActivePanel(null);
    
    // Force route back to orbit
    router.push('/');
    addLog("Telemetry lock: Flight path aborted. Returning to orbital space.");
  }, [travelState, router]);

  // Synchronize ambient noise state
  useEffect(() => {
    startAmbientSpaceDrone(soundMuted);
    return () => {
      stopAmbientSpaceDrone();
    };
  }, [soundMuted]);

  // 5. Route Synchronization: Single source of truth for travel triggers
  useEffect(() => {
    const match = pathname?.match(/\/planet\/([a-z]+)/);
    const isTravelling = targetPlanet !== null || travelState !== 'idle';

    if (match) {
      const routePlanet = match[1] as PlanetId;
      const validPlanets: PlanetId[] = ['core', 'education', 'skills', 'experience', 'achievements', 'resume', 'contact'];
      if (validPlanets.includes(routePlanet) && routePlanet !== currentPlanet && !isTravelling) {
        executeTravel(routePlanet);
      }
    } else if (pathname === '/' && currentPlanet !== 'space' && !isTravelling) {
      executeResetToSpace();
    }
  }, [pathname, currentPlanet, targetPlanet, travelState, executeTravel, executeResetToSpace]);

  // Synchronize router state with panel states for immediate content rendering/hydration
  useEffect(() => {
    const match = pathname?.match(/\/planet\/([a-z]+)/);
    if (match) {
      const pathPlanet = match[1] as PlanetId;
      const validPlanets: PlanetId[] = ['core', 'education', 'skills', 'experience', 'achievements', 'resume', 'contact'];
      if (validPlanets.includes(pathPlanet)) {
        setSelectedPlanet(pathPlanet);
        setActivePanel(pathPlanet);
      }
    } else if (pathname === '/') {
      setSelectedPlanet(null);
      setActivePanel(null);
    }
  }, [pathname]);

  // Exploration percentage (6 key places)
  const keyPlanets: PlanetId[] = ['core', 'education', 'skills', 'experience', 'achievements', 'resume', 'contact'];
  const explorationProgress = Math.round(
    (visitedPlanets.filter(p => keyPlanets.includes(p)).length / keyPlanets.length) * 100
  );

  return (
    <NavigationContext.Provider value={{
      currentPlanet,
      targetPlanet,
      travelState,
      visitedPlanets,
      soundMuted,
      reducedMotion,
      systemLogs,
      data,
      isLoading,
      selectedPlanet,
      setSelectedPlanet,
      activePanel,
      setActivePanel,
      setSoundMuted,
      setReducedMotion,
      travelTo,
      resetToSpace,
      addLog,
      explorationProgress,
      cancelTravel
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
