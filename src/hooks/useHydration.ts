'use client';

import { useState, useEffect } from 'react';

// Hook to avoid hydration errors
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

// Hook to handle conditional display after hydration
export function useHydratedValue<T>(serverValue: T, clientValue: T): T {
  const isHydrated = useIsHydrated();
  return isHydrated ? clientValue : serverValue;
}
