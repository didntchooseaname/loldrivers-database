import { useCallback, useMemo, useState, useEffect } from 'react';

// Hook pour la mémorisation des calculs coûteux
export const useOptimizedDrivers = (drivers: any[]) => {
  return useMemo(() => {
    return drivers.map(driver => ({
      ...driver,
      // Précalculer les propriétés coûteuses
      isKiller: driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) && 
        driver.ImportedFunctions.some((func: string) => 
          func.toLowerCase().includes('zwterminateprocess') ||
          func.toLowerCase().includes('zwkillprocess') ||
          func.toLowerCase().includes('ntterminate')
        ),
      hvciStatus: driver.LoadsDespiteHVCI ? 
        driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE' : null,
      hasSignatures: driver.Signatures && Array.isArray(driver.Signatures) && driver.Signatures.length > 0,
      resourceCount: driver.Resources ? driver.Resources.length : 0,
      functionCount: driver.ImportedFunctions ? driver.ImportedFunctions.length : 0
    }));
  }, [drivers]);
};

// Hook pour debouncer les recherches
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook pour la virtualisation
export const useVirtualization = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) => {
  return useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 2, // Buffer de 2
      itemCount
    );
    
    return {
      startIndex: Math.max(0, startIndex - 1), // Buffer avant
      endIndex,
      totalHeight: itemCount * itemHeight
    };
  }, [itemCount, itemHeight, containerHeight, scrollTop]);
};

// Hook pour gérer les callbacks optimisés
export const useOptimizedCallbacks = () => {
  const [cache] = useState(new Map());
  
  const memoizedCallback = useCallback((key: string, callback: () => void) => {
    if (!cache.has(key)) {
      cache.set(key, callback);
    }
    return cache.get(key);
  }, [cache]);
  
  return { memoizedCallback };
};

// Hook pour mesurer les performances
export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${endTime - startTime}ms`);
      }
    };
  });
  
  const measureAsync = useCallback(async (operation: string, fn: () => Promise<any>) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} - ${operation}: ${end - start}ms`);
    }
    
    return result;
  }, [componentName]);
  
  return { measureAsync };
};
