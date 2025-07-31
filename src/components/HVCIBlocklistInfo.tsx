'use client';

import React from 'react';
import SafeDate from '@/components/SafeDate';
import type { Stats } from '@/types';

interface HVCIBlocklistInfoProps {
  stats?: Stats;
}

export default function HVCIBlocklistInfo({ stats }: HVCIBlocklistInfoProps) {
  const hvciCheck = stats?.hvciBlocklistCheck;

  if (!hvciCheck) {
    return null;
  }

  return (
    <div className="hvci-blocklist-info">
      <div className="info-header">
        <i className="fas fa-shield-alt"></i>
        <span>Microsoft HVCI Block List Check</span>
      </div>
      
      <div className="info-content">
        <div className="info-item">
          <span className="info-label">Last Check:</span>
          <span className="info-value">
            <SafeDate date={hvciCheck.lastCheck} />
          </span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Microsoft Last Update:</span>
          <span className="info-value">
            <SafeDate date={hvciCheck.microsoftLastModified} />
          </span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Blocked Hashes:</span>
          <span className="info-value">{hvciCheck.totalBlockedHashes.toLocaleString()}</span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Matched Drivers:</span>
          <span className="info-value matched-count">{hvciCheck.matchedDrivers}</span>
        </div>
        
        <div className="info-source">
          <a 
            href={hvciCheck.source} 
            target="_blank" 
            rel="noopener noreferrer"
            className="source-link"
          >
            <i className="fas fa-external-link-alt"></i>
            Microsoft Official Block List
          </a>
        </div>
      </div>
    </div>
  );
}
