'use client';

import React from 'react';
import { PlanetId } from '@/context/NavigationContext';
import { notFound } from 'next/navigation';

interface PlanetPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function PlanetPage({ params }: PlanetPageProps) {
  // Unwrap parameters cleanly
  const resolvedParams = React.use(params as any) as { id: string };
  const id = resolvedParams.id as PlanetId;

  const validPlanets: PlanetId[] = ['core', 'education', 'skills', 'experience', 'achievements', 'resume', 'contact'];

  if (!validPlanets.includes(id)) {
    notFound();
  }

  // The actual detailed card UI is drawn in the global UniverseShell to keep rendering continuous during transitions.
  // This page renders null to avoid duplicates.
  return null;
}
