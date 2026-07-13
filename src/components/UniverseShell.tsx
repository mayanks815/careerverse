'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import SkeletonLoader from './SkeletonLoader';
import PlanetPanel from './PlanetPanel';
import ErrorBoundary from './ErrorBoundary';

const SpaceCanvas = dynamic(() => import('./SpaceCanvas'), {
  ssr: false,
  loading: () => <SkeletonLoader />
});

export default function UniverseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCMS = pathname?.startsWith('/mission-control');

  return (
    <div className="relative w-full h-full">
      {/* 3D WebGL space canvas rendered underneath */}
      {!isCMS && (
        <div className="absolute inset-0 z-0 select-none space-scanline">
          <ErrorBoundary fallbackTitle="Stellar WebGL Canvas">
            <SpaceCanvas />
          </ErrorBoundary>
        </div>
      )}
      
      {/* HTML Layout Content & details panels on top */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        <div className="w-full h-full pointer-events-auto">
          {children}
        </div>
        {!isCMS && (
          <ErrorBoundary fallbackTitle="Planet Details Panel">
            <PlanetPanel />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
