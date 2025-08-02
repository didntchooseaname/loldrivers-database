'use client';

import { memo } from 'react';

// Type pour les données réelles des drivers (basé sur driversCache.ts)
interface DriverSample {
  Filename?: string;
  OriginalFilename?: string;
  Description?: string;
  Company?: string;
  MD5?: string;
  SHA1?: string;
  SHA256?: string;
  [key: string]: unknown;
}

interface DriverData {
  Id?: string;
  KnownVulnerableSamples?: DriverSample[];
  [key: string]: unknown;
}

interface LazyDriverCardProps {
  driver: DriverData;
  index: number;
  isVisible?: boolean;
}

const LazyDriverCard = memo(({ driver, index, isVisible = true }: LazyDriverCardProps) => {
  // Obtenir le premier sample disponible
  const firstSample = driver.KnownVulnerableSamples?.[0];
  const driverName = firstSample?.Filename || firstSample?.OriginalFilename || 'Unknown';
  const driverDescription = firstSample?.Description || 'No description available';

  if (!isVisible) {
    // Placeholder minimaliste quand non visible
    return (
      <div 
        className="driver-card" 
        style={{ height: '200px', opacity: 0.3 }}
        data-index={index}
      >
        <div className="driver-header">
          <h3>{driverName}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-card" data-index={index} data-driver-id={driver.Id}>
      <div className="driver-header">
        <h3>{driverName}</h3>
        <p className="driver-description">
          {driverDescription}
        </p>
      </div>
      
      {/* Basic driver info */}
      <div className="driver-details">
        {firstSample?.Company && (
          <div className="driver-field">
            <span className="field-label">Company:</span>
            <span className="field-value">{firstSample.Company}</span>
          </div>
        )}
        
        {firstSample?.MD5 && (
          <div className="driver-field">
            <span className="field-label">MD5:</span>
            <span className="field-value font-mono text-xs">{firstSample.MD5}</span>
          </div>
        )}
        
        <div className="driver-skeleton">
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      </div>
    </div>
  );
});

LazyDriverCard.displayName = 'LazyDriverCard';

export default LazyDriverCard;
