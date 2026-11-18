'use client';

import { memo } from 'react';
import { ArrowUpRight, Download, Skull } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Driver } from '@/types';
import {
  CAPABILITY_LABELS, formatArchitecture, getCapabilities, getCertStatus, getCompany,
  getDescription, getDownloadUrl, getDriverName, getMvdbStatus, getPrimaryHash,
  getImportCount, getResourceCount, getVt, getVtBucket, truncateMiddle,
} from '@/lib/driver-model';
import { CopyButton } from './copy-button';
import { Term } from '@/components/term';
import { archGlossaryKey, hashGlossaryKey, type GlossaryKey } from '@/lib/glossary';

const CAPABILITY_GLOSSARY: Record<string, GlossaryKey> = {
  'memory-manipulator': 'memory-manipulator',
  'debug-bypass': 'debug-bypass',
  'registry-manipulator': 'registry-manipulator',
  'file-manipulator': 'file-manipulator',
};

interface DriverCardProps {
  driver: Driver;
  onOpen: (driver: Driver) => void;
  onDownload: (driver: Driver) => void;
}

export const DriverCard = memo(function DriverCard({ driver, onOpen, onDownload }: DriverCardProps) {
  const name = getDriverName(driver);
  const company = getCompany(driver);
  const arch = formatArchitecture(driver.MachineType);
  const mvdb = getMvdbStatus(driver);
  const cert = getCertStatus(driver);
  const capabilities = getCapabilities(driver);
  const killer = capabilities.includes('process-killer') || driver.FeaturedKiller === true;
  const description = getDescription(driver);
  const hash = getPrimaryHash(driver);
  const imports = getImportCount(driver);
  const resources = getResourceCount(driver);
  const hasDownload = getDownloadUrl(driver) !== null;
  const vt = getVt(driver);

  return (
    <article
      className={cn('driver-card group/card relative flex h-full flex-col rounded-xl border bg-card p-4 transition-[border-color,box-shadow,transform] duration-200 ease-out')}
      data-killer={killer || undefined}
    >
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-[0.9375rem] font-semibold leading-snug tracking-tight">
            <button
              type="button"
              onClick={() => onOpen(driver)}
              className="driver-card__open min-w-0 truncate text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
            >
              {name}
            </button>
            {arch && (
              <ArchChip label={arch} />
            )}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[company, driver.Created].filter(Boolean).join(' · ') || 'Unknown vendor'}
          </p>
        </div>
        {hasDownload && (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onDownload(driver); }}
            aria-label={`Download ${name}`}
            title="Download sample"
            className="relative z-10 -mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="size-4" aria-hidden />
          </button>
        )}
      </header>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {mvdb === 'passed' && <Term id="mvdb-passed" asChild><Badge variant="positive" className="status-badge">MVDB passed</Badge></Term>}
        {mvdb === 'blocked' && <Term id="mvdb-blocked" asChild><Badge variant="danger" className="status-badge">MVDB blocked</Badge></Term>}
        {mvdb === null && <Term id="mvdb-unchecked" asChild><Badge variant="neutral" className="status-badge">MVDB pending</Badge></Term>}
        {killer && (
          <Term id={driver.FeaturedKiller ? 'featured-killer' : 'process-killer'} asChild>
            <Badge variant="danger" className="status-badge">
              <Skull aria-hidden />{driver.FeaturedKiller ? 'Featured killer' : 'Process killer'}
            </Badge>
          </Term>
        )}
        {cert === 'valid' && <Term id="cert-valid" asChild><Badge variant="neutral" className="status-badge">Valid cert</Badge></Term>}
        {cert === 'expired' && <Term id="cert-expired" asChild><Badge variant="caution" className="status-badge">Expired cert</Badge></Term>}
        {vt && (
          <Term id="virustotal" asChild>
            <Badge variant={VT_VARIANT[getVtBucket(vt)]} className="status-badge font-mono tabular-nums">
              VT {vt.m + vt.s}/{vt.t}
            </Badge>
          </Term>
        )}
      </div>

      {description && (
        <p className="mt-3 line-clamp-3 text-[0.8125rem] leading-relaxed text-muted-foreground">{description}</p>
      )}

      {capabilities.filter((c) => c !== 'process-killer').length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.6875rem] text-muted-foreground" aria-label="Capabilities">
          {capabilities.filter((c) => c !== 'process-killer').map((capability) => (
            <Term key={capability} id={CAPABILITY_GLOSSARY[capability]} asChild>
              <li className="relative z-10 flex cursor-help items-center gap-1.5">
                <span className="size-1 rounded-full bg-muted-foreground/60" aria-hidden />
                {CAPABILITY_LABELS[capability]}
              </li>
            </Term>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        {hash && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 py-1 pl-2.5 pr-1">
            <Term id={hashGlossaryKey(hash.label, hash.kind)} asChild>
              <span className="relative z-10 cursor-help text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">{hash.label}</span>
            </Term>
            <code className="min-w-0 flex-1 truncate font-mono text-[0.75rem] text-foreground/90" title={hash.value}>
              {truncateMiddle(hash.value, 14, 10)}
            </code>
            <CopyButton value={hash.value} label={hash.label} />
          </div>
        )}
        <footer className="mt-3 flex items-center justify-between text-[0.6875rem] text-muted-foreground">
          <span className="tabular-nums">
            {imports > 0 ? `${imports} imports` : 'No import data'}
            {resources > 0 && ` · ${resources} ${resources === 1 ? 'reference' : 'references'}`}
          </span>
          <span className="flex items-center gap-0.5 font-medium text-foreground/80 transition-colors group-hover/card:text-foreground">
            Details <ArrowUpRight className="size-3.5 transition-transform group-hover/card:-translate-y-px group-hover/card:translate-x-px" aria-hidden />
          </span>
        </footer>
      </div>
    </article>
  );
});

const VT_VARIANT = { none: 'neutral', low: 'neutral', medium: 'caution', high: 'danger', unscanned: 'neutral' } as const;

function ArchChip({ label }: { label: string }) {
  const chip = <span className="relative z-10 shrink-0 cursor-help rounded border px-1 py-px font-mono text-[0.625rem] font-medium text-muted-foreground">{label}</span>;
  const key = archGlossaryKey(label);
  return key ? <Term id={key} asChild>{chip}</Term> : chip;
}

export function DriverCardSkeleton() {
  return (
    <div className="driver-card-skeleton flex h-full flex-col rounded-xl border bg-card p-4" aria-hidden>
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="skeleton mt-2 h-3 w-2/5 rounded" />
      <div className="mt-4 flex gap-1.5">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton mt-4 h-3 w-full rounded" />
      <div className="skeleton mt-2 h-3 w-11/12 rounded" />
      <div className="skeleton mt-2 h-3 w-3/5 rounded" />
      <div className="skeleton mt-6 h-8 w-full rounded-lg" />
    </div>
  );
}
