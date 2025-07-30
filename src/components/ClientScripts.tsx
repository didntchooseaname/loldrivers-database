'use client';

import { useEffect } from 'react';
import { useIsHydrated } from '@/hooks/useHydration';

export default function ClientScripts() {
  const isHydrated = useIsHydrated();

  useEffect(() => {
    if (!isHydrated) return;

    // Preload critical resources
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload next page of drivers
        fetch('/api/drivers?page=2&limit=50').catch(() => {
          // Ignore errors for preloading
        });
      });
    }
  }, [isHydrated]);

  return null; // Ce composant n'a pas de rendu visuel
}
