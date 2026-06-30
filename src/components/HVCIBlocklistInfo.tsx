'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import SafeDate from '@/components/SafeDate';
import type { Stats } from '@/types';
import { Shield, ExternalLink } from 'lucide-react';

interface HVCIBlocklistInfoProps {
  stats?: Stats;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
      <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground tabular-nums">{value}</p>
    </div>
  );
}

export default function HVCIBlocklistInfo({ stats }: HVCIBlocklistInfoProps) {
  const hvciCheck = stats?.hvciBlocklistCheck;

  if (!hvciCheck) {
    return null;
  }

  return (
    <Card size="sm" className="border-border bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Shield className="h-4 w-4" />
            </span>
            Microsoft Vulnerable Driver Blocklist
          </div>
          <a
            href={hvciCheck.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Official source
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Metric label="Last check" value={<SafeDate date={hvciCheck.lastCheck} />} />
          <Metric label="MS last update" value={<SafeDate date={hvciCheck.microsoftLastModified} />} />
          <Metric label="Blocked hashes" value={hvciCheck.totalBlockedHashes.toLocaleString()} />
          <Metric label="Matched drivers" value={hvciCheck.matchedDrivers.toLocaleString()} />
        </div>
      </CardContent>
    </Card>
  );
}
