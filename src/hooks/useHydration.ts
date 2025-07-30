'use client';

import { useState, useEffect } from 'react';

// Hook pour éviter les erreurs d'hydratation
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

// Hook pour gérer l'affichage conditionnel après hydratation
export function useHydratedValue<T>(serverValue: T, clientValue: T): T {
  const isHydrated = useIsHydrated();
  return isHydrated ? clientValue : serverValue;
}
