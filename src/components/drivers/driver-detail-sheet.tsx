'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Radar,
  AlertTriangle, Download, ExternalLink, FileSignature, Fingerprint, Search,
  Skull, Terminal, Waypoints,
} from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Driver } from '@/types';
import {
  CAPABILITY_LABELS, FUNCTION_GROUP_LABELS, formatArchitecture, getCapabilities,
  getCertStatus, getCompany, getDescription, getDownloadUrl, getDriverName, getHashes,
  getMvdbStatus, getResources, getSigners, getVt, getVtBucket, groupImportedFunctions,
} from '@/lib/driver-model';
import { CopyButton } from './copy-button';
import { Term } from '@/components/term';
import { archGlossaryKey, hashGlossaryKey, type GlossaryKey } from '@/lib/glossary';

const CAPABILITY_GLOSSARY: Record<string, GlossaryKey> = {
  'process-killer': 'process-killer',
  'memory-manipulator': 'memory-manipulator',
  'debug-bypass': 'debug-bypass',
  'registry-manipulator': 'registry-manipulator',
  'file-manipulator': 'file-manipulator',
};

interface DriverDetailSheetProps {
  driver: Driver | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (driver: Driver) => void;
  onAuthentihashHelp: () => void;
}

export default function DriverDetailSheet({ driver, loading, onOpenChange, onDownload, onAuthentihashHelp }: DriverDetailSheetProps) {
  return (
    <Sheet open={driver !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true });
        }}
        className="driver-sheet outline-none flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[40rem]"
      >
        {driver && (
          <DriverDetail
            key={String(driver.SHA256 ?? driver.MD5 ?? driver.Id)}
            driver={driver}
            loading={loading}
            onDownload={onDownload}
            onAuthentihashHelp={onAuthentihashHelp}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DriverDetail({ driver, loading, onDownload, onAuthentihashHelp }: Omit<DriverDetailSheetProps, 'onOpenChange'> & { driver: Driver }) {
  const name = getDriverName(driver);
  const company = getCompany(driver);
  const mvdb = getMvdbStatus(driver);
  const cert = getCertStatus(driver);
  const capabilities = getCapabilities(driver);
  const killer = capabilities.includes('process-killer') || driver.FeaturedKiller === true;
  const description = getDescription(driver);
  const hashes = getHashes(driver);
  const signers = getSigners(driver);
  const vt = getVt(driver);
  const resources = getResources(driver);
  const commands = driver.Commands;
  const hasDownload = getDownloadUrl(driver) !== null;

  const metadataRows: Array<[React.ReactNode, React.ReactNode]> = [
    ['Vendor', company],
    ['Product', str(driver.Product)],
    ['Original filename', str(driver.OriginalFilename)],
    ['File version', str(driver.FileVersion)],
    ['Architecture', archValue(formatArchitecture(driver.MachineType))],
    ['Compiled', str(driver.CreationTimestamp)],
    ['Added to catalog', str(driver.Created)],
    ['Category', str(driver.Category)],
    [<Term key="mitre" id="mitre">MITRE ATT&amp;CK</Term>, str(driver.MitreID)],
    [<Term key="imphash" id="imphash" />, str(driver.Imphash) && <code className="font-mono text-xs break-all">{str(driver.Imphash)}</code>],
    ['Reported by', str(driver.Author)],
  ];
  const metadata = metadataRows.filter(([, value]) => Boolean(value));

  return (
    <>
      <div className="shrink-0 border-b px-6 pb-5 pt-6 pr-14">
        <div className="flex flex-wrap gap-1.5">
          {mvdb === 'passed' && <Term id="mvdb-passed" asChild side="bottom"><Badge variant="positive">MVDB passed</Badge></Term>}
          {mvdb === 'blocked' && <Term id="mvdb-blocked" asChild side="bottom"><Badge variant="danger">MVDB blocked</Badge></Term>}
          {mvdb === null && <Term id="mvdb-unchecked" asChild side="bottom"><Badge variant="neutral">MVDB not checked yet</Badge></Term>}
          {killer && <Term id="process-killer" asChild side="bottom"><Badge variant="danger"><Skull aria-hidden />Process killer</Badge></Term>}
          {cert === 'valid' && <Term id="cert-valid" asChild side="bottom"><Badge variant="neutral">Valid certificate</Badge></Term>}
          {cert === 'expired' && <Term id="cert-expired" asChild side="bottom"><Badge variant="caution">Expired certificate</Badge></Term>}
        </div>
        <SheetTitle className="mt-3 break-all text-xl font-semibold tracking-tight">{name}</SheetTitle>
        <SheetDescription className="mt-1 text-sm text-muted-foreground">
          {[company, str(driver.Created) && `added ${driver.Created}`].filter(Boolean).join(' · ') || 'Vulnerable or malicious Windows driver'}
        </SheetDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          {hasDownload && (
            <Button size="sm" onClick={() => onDownload(driver)}>
              <Download aria-hidden /> Download sample
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-8 px-6 py-6" aria-busy={loading}>
          {description && (
            <Section title="Summary">
              <p className="text-sm leading-relaxed text-foreground/85">{description}</p>
              {capabilities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {capabilities.map((c) => (
                    <Term key={c} id={CAPABILITY_GLOSSARY[c]} asChild>
                      <Badge variant={c === 'process-killer' ? 'danger' : 'outline'} className="cursor-help font-medium">
                        {CAPABILITY_LABELS[c]}
                      </Badge>
                    </Term>
                  ))}
                </div>
              )}
            </Section>
          )}

          {driver.SHA256 && (
            <Section title={<Term id="virustotal" />} icon={Radar}>
              <VirusTotalPanel vt={vt} sha256={String(driver.SHA256)} />
            </Section>
          )}

          {hashes.length > 0 && (
            <Section
              title="Hashes"
              icon={Fingerprint}
              action={hashes.some((h) => h.kind === 'authentihash') && (
                <button type="button" onClick={onAuthentihashHelp} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  What is an authentihash?
                </button>
              )}
            >
              <dl className="divide-y overflow-hidden rounded-lg border">
                {hashes.map((hash) => (
                  <div key={`${hash.kind}-${hash.label}`} className="flex items-center gap-3 bg-card px-3 py-2">
                    <dt className="w-24 shrink-0 text-xs text-muted-foreground">
                      <Term id={hashGlossaryKey(hash.label, hash.kind)} side="right">
                        {hash.kind === 'authentihash' ? `Auth ${hash.label}` : hash.label}
                      </Term>
                    </dt>
                    <dd className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed">{hash.value}</dd>
                    <CopyButton value={hash.value} label={hash.kind === 'authentihash' ? `Authentihash ${hash.label}` : hash.label} />
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {metadata.length > 0 && (
            <Section title="File metadata">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {metadata.map(([label, value], index) => (
                  <div key={index} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 break-words text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {signers.length > 0 && (
            <Section title="Signatures" icon={FileSignature}>
              <ul className="flex flex-col gap-2">
                {signers.map((signer) => (
                  <li key={`${signer.subject}-${signer.validTo}`} className="rounded-lg border bg-card px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-medium">{signer.subject}</p>
                      {signer.validTo && (
                        <Badge variant={signer.expired ? 'caution' : 'positive'} className="shrink-0">
                          {signer.expired ? 'Expired' : 'Valid'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[signer.issuer && `Issued by ${signer.issuer}`, signer.validTo && `valid to ${signer.validTo.slice(0, 10)}`].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {commands && (commands.Command?.trim() || commands.Usecase || commands.Privileges) && (
            <Section title="Usage" icon={Terminal}>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
                {[['Use case', commands.Usecase], ['Privileges', commands.Privileges], ['Operating system', commands.OperatingSystem]]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 text-sm">{value}</dd>
                    </div>
                  ))}
              </dl>
              {commands.Command?.trim() && (
                <div className="mt-4 overflow-hidden rounded-lg border bg-muted/40">
                  <div className="flex items-center justify-between border-b px-3 py-1">
                    <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">Command</span>
                    <CopyButton value={commands.Command} label="Command" />
                  </div>
                  <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed"><code>{commands.Command}</code></pre>
                </div>
              )}
            </Section>
          )}

          {loading ? <DetailSkeleton /> : <ImportedFunctions functions={driver.ImportedFunctions} />}

          {resources.length > 0 && (
            <Section title="References" icon={Waypoints}>
              <ul className="flex flex-col">
                {resources.map((resource) => (
                  <li key={resource}>
                    <ResourceLink href={resource} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

function ImportedFunctions({ functions }: { functions?: string[] }) {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => groupImportedFunctions(functions), [functions]);
  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () => groups
      .map(([group, fns]) => [group, needle ? fns.filter((f) => f.toLowerCase().includes(needle)) : fns] as const)
      .filter(([, fns]) => fns.length > 0),
    [groups, needle],
  );

  if (!functions || functions.length === 0) return null;

  return (
    <Section
      title={<Term id="imports" />}
      count={functions.length}
      action={functions.length > 12 && (
        <label className="relative">
          <span className="sr-only">Filter imported functions</span>
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter…"
            className="h-7 w-36 rounded-md border bg-background pl-7 pr-2 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
          />
        </label>
      )}
    >
      <div className="flex flex-col gap-4">
        {visible.map(([group, fns]) => (
          <div key={group}>
            <h4 className={cn('mb-1.5 flex items-center gap-1.5 text-xs font-medium', group === 'critical' ? 'text-destructive' : 'text-muted-foreground')}>
              {group === 'critical' && <AlertTriangle className="size-3.5" aria-hidden />}
              {FUNCTION_GROUP_LABELS[group]}
              <span className="font-mono tabular-nums opacity-70">{fns.length}</span>
            </h4>
            <ul className="flex flex-wrap gap-1">
              {fns.map((fn) => (
                <li key={fn}>
                  <CopyButton
                    value={fn}
                    label={fn}
                    className={cn(
                      'rounded border bg-card px-1.5 py-0.5 font-mono text-[0.6875rem] [&>svg]:hidden',
                      group === 'critical' ? 'border-destructive/40 text-destructive' : 'text-foreground/85',
                    )}
                  >
                    {fn}
                  </CopyButton>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {visible.length === 0 && <p className="text-sm text-muted-foreground">No function matches “{query}”.</p>}
      </div>
    </Section>
  );
}

function ResourceLink({ href }: { href: string }) {
  let host = '';
  let label = href;
  try {
    const url = new URL(href);
    host = url.hostname.replace(/^www\./, '');
    label = `${host}${url.pathname === '/' ? '' : url.pathname}`;
  } catch {
    // not a URL, render as text
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      className="group/link -mx-2 flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
    >
      {host ? (
        <Image
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`}
          alt=""
          width={16}
          height={16}
          className="size-4 shrink-0 rounded-sm"
          unoptimized
        />
      ) : (
        <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className="min-w-0 flex-1 truncate text-foreground/85 group-hover/link:text-foreground">{label}</span>
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/link:opacity-100" aria-hidden />
    </a>
  );
}

function Section({
  title, icon: Icon, count, action, children,
}: {
  title: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex min-h-7 items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[0.8125rem] font-semibold tracking-tight">
          {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
          {title}
          {typeof count === 'number' && <span className="font-mono text-xs font-normal tabular-nums text-muted-foreground">{count}</span>}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

const VT_BAR: Record<string, string> = {
  none: 'bg-muted-foreground/40',
  low: 'bg-muted-foreground/70',
  medium: 'bg-warning',
  high: 'bg-destructive',
};

function VirusTotalPanel({ vt, sha256 }: { vt: ReturnType<typeof getVt>; sha256: string }) {
  const link = `https://www.virustotal.com/gui/file/${sha256}`;
  if (!vt) {
    return (
      <p className="text-sm text-muted-foreground">
        Not scanned yet. New samples are queued first by the daily enrichment job.{' '}
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">Open on VirusTotal</a>
      </p>
    );
  }
  const detections = vt.m + vt.s;
  const bucket = getVtBucket(vt);
  const ratio = vt.t > 0 ? Math.min(100, (detections / vt.t) * 100) : 0;
  const analysed = vt.d ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(vt.d)) : null;
  return (
    <div className="rounded-lg border bg-card p-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-2xl font-medium tabular-nums">
          {detections}<span className="text-base text-muted-foreground">/{vt.t}</span>
        </p>
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Full report <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${detections} of ${vt.t} engines flag this file`}>
        <div className={cn('h-full rounded-full', VT_BAR[bucket])} style={{ width: `${Math.max(ratio, detections > 0 ? 2 : 0)}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {vt.m} malicious, {vt.s} suspicious{analysed && ` · last analysed ${analysed}`}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading details">
      <div className="skeleton h-4 w-32 rounded" />
      <div className="skeleton h-24 w-full rounded-lg" />
      <div className="skeleton h-4 w-40 rounded" />
      <div className="skeleton h-16 w-full rounded-lg" />
    </div>
  );
}

function archValue(label: string | null): React.ReactNode {
  const key = archGlossaryKey(label);
  return key ? <Term id={key}>{label}</Term> : label;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'unknown' ? value.trim() : null;
}
