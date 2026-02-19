'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import SafeDate from '@/components/SafeDate';
import type { Stats } from '@/types';
import { Shield, ExternalLink } from 'lucide-react';

interface HVCIBlocklistInfoProps {
  stats?: Stats;
}

export default function HVCIBlocklistInfo({ stats }: HVCIBlocklistInfoProps) {
  const hvciCheck = stats?.hvciBlocklistCheck;

  if (!hvciCheck) {
    return null;
  }

  return (
    <Card className="bg-card text-card-foreground border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-base font-medium">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span>Microsoft Vulnerable Drivers Blocklist Check</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Last Check:</span>
          <SafeDate date={hvciCheck.lastCheck} />
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Microsoft Last Update:</span>
          <SafeDate date={hvciCheck.microsoftLastModified} />
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Blocked Hashes:</span>
          <span>{hvciCheck.totalBlockedHashes.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Matched Drivers:</span>
          <span className="font-medium">{hvciCheck.matchedDrivers}</span>
        </div>
        <a
          href={hvciCheck.source}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline mt-2"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Microsoft Official Block List
        </a>
      </CardContent>
    </Card>
  );
}
