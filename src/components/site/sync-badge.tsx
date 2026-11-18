'use client';

import useSWR from 'swr';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Stats } from '@/types';

interface SyncStatus {
  upstreamCommit: string | null;
  upstreamCommittedAt: string | null;
  upToDate: boolean | null;
  lastCheckedAt: string | null;
}

const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const DAY_TIME = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

const fmt = (value: string | null | undefined, formatter = DAY) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : formatter.format(date);
};

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null));

export function SyncBadge({ sync }: { sync: Stats['catalogSync'] }) {
  const { data: live } = useSWR<SyncStatus | null>('/api/sync', fetcher, { revalidateOnFocus: false });

  if (!sync) return null;
  const pending = live?.upToDate === false;
  const commit = sync.upstream.commit.slice(0, 7);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p
          tabIndex={0}
          className={cn(
            'sync-badge inline-flex cursor-help items-center gap-2 rounded-full border bg-card/70 px-3 py-1 font-mono text-[0.6875rem] text-muted-foreground backdrop-blur outline-none focus-visible:ring-2 focus-visible:ring-ring',
            pending && 'border-warning/40',
          )}
        >
          <span className={cn('live-dot', pending && 'bg-warning after:border-warning')} aria-hidden />
          {pending ? 'Upstream update pending' : 'In sync with LOLDrivers'}
          <span aria-hidden className="text-border">|</span>
          <time dateTime={sync.synced_at}>synced {fmt(sync.synced_at)}</time>
        </p>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-80 text-left">
        <p className="font-medium">{pending ? 'A newer upstream catalog is available' : 'Catalog matches the official LOLDrivers project'}</p>
        <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 opacity-85">
          <dt>Catalog version</dt>
          <dd className="font-mono">{commit} · {fmt(sync.upstream.committed_at)}</dd>
          <dt>Pulled</dt>
          <dd>{fmt(sync.synced_at, DAY_TIME)} UTC</dd>
          {live?.lastCheckedAt && (<><dt>Last check</dt><dd>{fmt(live.lastCheckedAt, DAY_TIME)} UTC</dd></>)}
          {pending && live?.upstreamCommit && (<><dt>Upstream</dt><dd className="font-mono">{live.upstreamCommit.slice(0, 7)} · {fmt(live.upstreamCommittedAt)}</dd></>)}
        </dl>
        <p className="mt-1.5 opacity-70">The pipeline checks upstream every 6 hours and re-runs the Microsoft blocklist check after each update.</p>
      </TooltipContent>
    </Tooltip>
  );
}
