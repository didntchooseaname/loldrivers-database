import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type { Driver } from '@/types';

interface VirtualizedDriverListProps {
  drivers: Driver[];
  onDriverSelect?: (driver: Driver) => void;
  itemHeight?: number;
  containerHeight?: number;
}

interface DriverItemProps {
  driver: Driver;
  style: React.CSSProperties;
  onClick?: () => void;
}

const DriverItem = memo(({ driver, style, onClick }: DriverItemProps) => {
  return (
    <div 
      style={style}
      className="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {driver.OriginalFilename || driver.Filename || 'Unknown'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Company:</span>
              <span className="ml-2 text-gray-600">{driver.Company || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">MD5:</span>
              <span className="ml-2 text-gray-600 font-mono text-xs">{driver.MD5 || 'N/A'}</span>
            </div>
          </div>
          
          {/* Badges for important properties */}
          <div className="flex flex-wrap gap-2 mt-3">
            {driver.LoadsDespiteHVCI && driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                HVCI Bypass
              </span>
            )}
            
            {driver.Signatures && Array.isArray(driver.Signatures) && driver.Signatures.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Signed
              </span>
            )}
            
            {driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) && 
             driver.ImportedFunctions.some(func => 
               func.toLowerCase().includes('zwterminateprocess') ||
               func.toLowerCase().includes('zwkillprocess') ||
               func.toLowerCase().includes('ntterminate')
             ) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Killer Driver
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

DriverItem.displayName = 'DriverItem';

const VirtualizedDriverList = memo(({ 
  drivers, 
  onDriverSelect, 
  itemHeight = 120, 
  containerHeight = 600 
}: VirtualizedDriverListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 5, drivers.length); // Buffer of 5 elements
    
    return { start: Math.max(0, start - 5), end }; // Buffer of 5 elements avant
  }, [scrollTop, itemHeight, containerHeight, drivers.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleItems = useMemo(() => {
    return drivers.slice(visibleRange.start, visibleRange.end).map((driver, index) => {
      const actualIndex = visibleRange.start + index;
      return {
        driver,
        style: {
          position: 'absolute' as const,
          top: actualIndex * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      };
    });
  }, [drivers, visibleRange, itemHeight]);

  if (drivers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No drivers found</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto border border-gray-200 rounded-lg"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: drivers.length * itemHeight, position: 'relative' }}>
        {visibleItems.map(({ driver, style }, index) => (
          <DriverItem
            key={`${driver.MD5}-${visibleRange.start + index}`}
            driver={driver}
            style={style}
            onClick={() => onDriverSelect?.(driver)}
          />
        ))}
      </div>
    </div>
  );
});

VirtualizedDriverList.displayName = 'VirtualizedDriverList';

export default VirtualizedDriverList;
