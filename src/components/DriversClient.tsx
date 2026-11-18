'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { preload } from 'swr';
import { toast } from 'sonner';
import { AlertTriangle, RotateCw, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import type { HelpTopic } from '@/components/help-dialogs';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { formatCount } from '@/components/site/format';
import { SyncBadge } from '@/components/site/sync-badge';
import { DriverCard, DriverCardSkeleton } from '@/components/drivers/driver-card';
import { FilterPanel } from '@/components/drivers/filter-panel';
import { Pagination } from '@/components/drivers/pagination';
import { SearchField } from '@/components/drivers/search-field';
import {
  SORT_OPTIONS, countFacetFilters, findFilter, getSort, normalizeFilters, setSort, toggleFilter,
} from '@/components/drivers/filters-config';
import { useDebounce } from '@/hooks/use-debounce';
import { buildApiUrl, parseFiltersFromURL, serializeFiltersToParams } from '@/lib/filters';
import { driverKey, getDownloadUrl, getDriverName } from '@/lib/driver-model';
import { cn } from '@/lib/utils';
import { Term } from '@/components/term';
import type { GlossaryKey } from '@/lib/glossary';
import type { Driver, DriversResponse, Stats } from '@/types';

const loadDetail = () => import('@/components/drivers/driver-detail-sheet');
const loadMobileFilters = () => import('@/components/drivers/mobile-filters');
const loadHelp = () => import('@/components/help-dialogs');
const loadChangelog = () => import('@/components/ChangelogPopup');
const loadTerms = () => import('@/components/TermsPopup');

const DriverDetailSheet = dynamic(loadDetail, { ssr: false });
const MobileFilters = dynamic(loadMobileFilters, { ssr: false });
const HelpDialogs = dynamic(loadHelp, { ssr: false });
const ChangelogPopup = dynamic(loadChangelog, { ssr: false });
const TermsPopup = dynamic(loadTerms, { ssr: false });

const PAGE_SIZE = 24;
const SUGGESTIONS = ['RTCore64', 'Gigabyte', 'ZwTerminateProcess', 'PhantomKiller', 'procexp'];

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
};


interface DriversClientProps {
  initialDrivers: DriversResponse;
  initialStats: { success: boolean; stats: Stats };
  initialUiParams?: { searchQuery: string; activeFilters: string[]; currentPage: number };
}

export default function DriversClient({ initialDrivers, initialStats, initialUiParams }: DriversClientProps) {
  const [inputValue, setInputValue] = useState(initialUiParams?.searchQuery ?? '');
  const [searchQuery, setSearchQuery] = useState(initialUiParams?.searchQuery ?? '');
  const [filters, setFilters] = useState(() => normalizeFilters(initialUiParams?.activeFilters ?? []));
  const [page, setPage] = useState(initialUiParams?.currentPage ?? 1);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [dialog, setDialog] = useState<'help' | 'filters' | 'authentihash' | 'changelog' | 'terms' | null>(null);
  const [heroSearchVisible, setHeroSearchVisible] = useState(true);

  // Overlays are code-split and mounted the first time they are needed.
  const wanted = {
    detail: selected !== null,
    filters: mobileFilters,
    help: dialog === 'help' || dialog === 'filters' || dialog === 'authentihash',
    changelog: dialog === 'changelog',
    terms: dialog === 'terms',
  };
  const [mounted, setMounted] = useState<Record<keyof typeof wanted, boolean>>({
    detail: false, filters: false, help: false, changelog: false, terms: false,
  });
  const newlyWanted = (Object.keys(wanted) as Array<keyof typeof wanted>).filter((key) => wanted[key] && !mounted[key]);
  if (newlyWanted.length > 0) {
    setMounted((current) => ({ ...current, ...Object.fromEntries(newlyWanted.map((key) => [key, true])) }));
  }

  const heroInputRef = useRef<HTMLInputElement>(null);
  const compactInputRef = useRef<HTMLInputElement>(null);
  const heroSearchRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Live search: commit the debounced input once it is empty or at least 2 chars.
  const debouncedInput = useDebounce(inputValue, 250);
  const [lastDebounced, setLastDebounced] = useState(debouncedInput);
  if (debouncedInput !== lastDebounced) {
    setLastDebounced(debouncedInput);
    const trimmed = debouncedInput.trim();
    if ((trimmed.length >= 2 || trimmed.length === 0) && trimmed !== searchQuery) {
      setSearchQuery(trimmed);
      setPage(1);
    }
  }

  const apiUrl = useMemo(() => buildApiUrl(filters, searchQuery, page, PAGE_SIZE), [filters, searchQuery, page]);
  const [serverRenderedUrl] = useState(apiUrl);
  const isPristine = apiUrl === serverRenderedUrl;

  const { data, error, isLoading, isValidating, mutate } = useSWR<DriversResponse>(
    isPristine ? null : apiUrl,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false, dedupingInterval: 10_000, errorRetryCount: 2 },
  );
  const driversData = isPristine ? initialDrivers : data;
  const drivers = driversData?.drivers ?? [];
  const total = driversData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstLoad = !isPristine && !data && isLoading;
  const busy = !isPristine && (isLoading || isValidating);

  const { data: statsData } = useSWR<{ success: boolean; stats: Stats }>('/api/stats', fetcher, {
    fallbackData: initialStats,
    revalidateOnFocus: false,
    revalidateOnMount: false,
    refreshInterval: 600_000,
  });
  const stats = statsData?.stats;

  const { data: detailData, error: detailError } = useSWR<{ success: boolean; driver: Driver }>(
    selected ? `/api/drivers/${encodeURIComponent(driverKey(selected))}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 600_000 },
  );


  // Keep the address bar shareable without adding history entries per keystroke.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.search = serializeFiltersToParams(filters, searchQuery, page).toString();
    if (url.toString() !== window.location.href) window.history.replaceState(null, '', url);
  }, [filters, searchQuery, page]);

  useEffect(() => {
    const onPopState = () => {
      const parsed = parseFiltersFromURL(new URL(window.location.href).searchParams);
      setInputValue(parsed.searchQuery);
      setSearchQuery(parsed.searchQuery);
      setFilters(normalizeFilters(parsed.activeFilters));
      setPage(parsed.currentPage);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const target = heroSearchRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setHeroSearchVisible(entry.isIntersecting), {
      rootMargin: '-56px 0px 0px 0px',
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const typing = target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]');
      const shortcut = (event.key === '/' && !typing) || (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey));
      if (!shortcut) return;
      event.preventDefault();
      const input = heroSearchVisible ? heroInputRef.current : compactInputRef.current;
      input?.focus();
      input?.select();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [heroSearchVisible]);

  useEffect(() => {
    const warm = () => { void loadDetail(); void loadHelp(); };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(warm, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Warm the next page so pagination feels instant.
  useEffect(() => {
    if (page < totalPages && drivers.length > 0) {
      const timer = setTimeout(() => preload(buildApiUrl(filters, searchQuery, page + 1, PAGE_SIZE), fetcher), 600);
      return () => clearTimeout(timer);
    }
  }, [filters, searchQuery, page, totalPages, drivers.length]);

  const scrollToResults = useCallback(() => {
    const el = resultsRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const commitSearch = useCallback(() => {
    const trimmed = inputValue.trim();
    setSearchQuery(trimmed);
    setPage(1);
  }, [inputValue]);

  const clearSearch = useCallback(() => {
    setInputValue('');
    setSearchQuery('');
    setPage(1);
  }, []);

  const runSuggestion = useCallback((value: string) => {
    setInputValue(value);
    setSearchQuery(value);
    setPage(1);
  }, []);

  const onToggleFilter = useCallback((key: string) => {
    setFilters((current) => toggleFilter(current, key));
    setPage(1);
  }, []);

  const onSortChange = useCallback((sort: string) => {
    setFilters((current) => setSort(current, sort));
    setPage(1);
  }, []);

  const resetFacets = useCallback(() => {
    setFilters((current) => setSort(new Set(), getSort(current)));
    setPage(1);
  }, []);

  const resetAll = useCallback(() => {
    setInputValue('');
    setSearchQuery('');
    setFilters(new Set());
    setPage(1);
  }, []);

  const goToPage = useCallback((next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    requestAnimationFrame(scrollToResults);
  }, [totalPages, scrollToResults]);

  const prefetchPage = useCallback((target: number) => {
    if (target >= 1 && target <= totalPages) preload(buildApiUrl(filters, searchQuery, target, PAGE_SIZE), fetcher);
  }, [filters, searchQuery, totalPages]);

  const share = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link to this view copied');
    } catch {
      toast.error('Clipboard unavailable');
    }
  }, []);

  const download = useCallback((driver: Driver) => {
    const url = getDownloadUrl(driver);
    if (!url) {
      toast.error('No download available for this sample');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    toast(`Downloading ${getDriverName(driver)}`, { description: 'Live driver sample. Handle it in an isolated lab.' });
  }, []);

  const facetCount = countFacetFilters(filters);
  const sort = getSort(filters);
  const activeChips = [...filters].map((key) => findFilter(key)).filter((entry) => entry !== undefined);

  const searchProps = {
    value: inputValue,
    onChange: setInputValue,
    onSubmit: commitSearch,
    onClear: clearSearch,
    busy,
  };

  return (
    <>
      <SiteHeader
        showSearch={!heroSearchVisible}
        busy={busy}
        search={<SearchField {...searchProps} ref={compactInputRef} size="compact" id="driver-search-compact" />}
        onChangelog={() => setDialog('changelog')}
        onShare={share}
        onHelp={() => setDialog('help')}
      />

      <main id="main-content">
        <section className="relative overflow-hidden border-b">
          <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pb-12 pt-14 text-center sm:px-6 sm:pb-16 sm:pt-20">
            <SyncBadge sync={stats?.catalogSync} />
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Hunt vulnerable Windows drivers
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
              Search {formatCount(stats?.total)} known-abused kernel drivers by name, hash, vendor or <Term id="imports">imported API</Term>, and check them against the <Term id="mvdb">Microsoft blocklist</Term>.
            </p>

            <div ref={heroSearchRef} className="mt-9 w-full">
              <SearchField {...searchProps} ref={heroInputRef} id="driver-search" />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span className="mr-1">Try</span>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => runSuggestion(suggestion)}
                  className="rounded-md border bg-card/60 px-2 py-1 font-mono text-[0.6875rem] text-foreground/80 transition-colors hover:border-foreground/25 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="stats mt-12 grid w-full grid-cols-2 overflow-hidden rounded-xl border bg-card/70 text-left backdrop-blur sm:grid-cols-4">
              <Stat label="Drivers catalogued" value={stats?.total} />
              <Stat label="MVDB passed" glossary="mvdb-passed" value={stats?.hvciCompatible} tone="positive" active={filters.has('hvci')} onClick={() => onToggleFilter('hvci')} />
              <Stat label="Blocked by MVDB" glossary="mvdb-blocked" value={stats?.mvdbBlockedDrivers} />
              <Stat label="Process killers" glossary="process-killer" value={stats?.processKillerDrivers} tone="danger" active={filters.has('process-killer')} onClick={() => onToggleFilter('process-killer')} />
            </div>
          </div>
        </section>

        <div ref={resultsRef} id="results" className="mx-auto grid max-w-[90rem] scroll-mt-16 gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:pt-10">
          <aside className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-6 pr-1">
              <FilterPanel active={filters} stats={stats} onToggle={onToggleFilter} onReset={resetFacets} />
              <button type="button" onClick={() => setDialog('filters')} className="mt-6 px-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                How filters work
              </button>
            </div>
          </aside>

          <section aria-labelledby="results-heading" className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <h2 id="results-heading" className="results-count mr-auto text-sm text-muted-foreground" aria-live="polite">
                {firstLoad ? 'Searching…' : (
                  <>
                    <span className="font-mono font-medium tabular-nums text-foreground">{formatCount(total)}</span>{' '}
                    {total === 1 ? 'driver' : 'drivers'}
                    {searchQuery && <> matching <span className="text-foreground">“{searchQuery}”</span></>}
                  </>
                )}
              </h2>
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileFilters(true)}>
                <SlidersHorizontal aria-hidden /> Filters
                {facetCount > 0 && <span className="rounded bg-foreground px-1.5 font-mono text-[0.6875rem] text-background">{facetCount}</span>}
              </Button>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Sort</span>
                <select
                  value={sort}
                  onChange={(event) => onSortChange(event.target.value)}
                  className="h-9 rounded-md border bg-card px-2.5 text-sm text-foreground"
                  aria-label="Sort results"
                >
                  {SORT_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                </select>
              </label>
            </div>

            {(activeChips.length > 0 || searchQuery) && (
              <div className="active-filters mt-4 flex flex-wrap items-center gap-1.5">
                {searchQuery && (
                  <Chip onRemove={clearSearch} label={`Search: ${searchQuery}`} />
                )}
                {activeChips.map(({ option }) => (
                  <Chip key={option.key} label={option.label} onRemove={() => onToggleFilter(option.key)} />
                ))}
                <button type="button" onClick={resetAll} className="ml-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  Clear all
                </button>
              </div>
            )}

            {error && (
              <div role="alert" className="mt-6 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
                <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
                <span className="flex-1">Could not load results. Check your connection and retry.</span>
                <Button size="sm" variant="outline" onClick={() => mutate()}><RotateCw aria-hidden /> Retry</Button>
              </div>
            )}

            <div
              className={cn('drivers-grid mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3', busy && !firstLoad && 'opacity-60 transition-opacity')}
              aria-busy={busy}
            >
              {firstLoad
                ? Array.from({ length: 6 }, (_, i) => <DriverCardSkeleton key={i} />)
                : drivers.map((driver, index) => (
                  <div key={`${page}-${index}-${driverKey(driver)}`} className="card-enter h-full" style={{ '--i': Math.min(index, 10) } as React.CSSProperties}>
                    <DriverCard driver={driver} onOpen={setSelected} onDownload={download} />
                  </div>
                ))}
            </div>

            {!firstLoad && !error && drivers.length === 0 && (
              <div className="empty-state mt-6 flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-full border bg-card">
                  <SearchX className="size-5 text-muted-foreground" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">No drivers match</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Try a shorter term, a full SHA256 or MD5, or remove some filters.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={resetAll}><X aria-hidden /> Clear search and filters</Button>
                  <Button variant="ghost" size="sm" onClick={() => runSuggestion('ZwTerminateProcess')}>Try “ZwTerminateProcess”</Button>
                </div>
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} onChange={goToPage} onIntent={prefetchPage} />
          </section>
        </div>
      </main>

      <SiteFooter onTerms={() => setDialog('terms')} />

      {mounted.filters && (
        <MobileFilters
          open={mobileFilters}
          onOpenChange={setMobileFilters}
          active={filters}
          stats={stats}
          total={formatCount(total)}
          onToggle={onToggleFilter}
          onReset={resetFacets}
        />
      )}
      {mounted.detail && (
        <DriverDetailSheet
          driver={selected ? detailData?.driver ?? selected : null}
          loading={selected !== null && !detailData && !detailError}
          onOpenChange={(open) => { if (!open) setSelected(null); }}
          onDownload={download}
          onAuthentihashHelp={() => setDialog('authentihash')}
        />
      )}
      {mounted.help && (
        <HelpDialogs topic={wanted.help ? (dialog as HelpTopic) : null} onClose={() => setDialog(null)} />
      )}
      {mounted.changelog && <ChangelogPopup isVisible={dialog === 'changelog'} onClose={() => setDialog(null)} />}
      {mounted.terms && <TermsPopup isVisible={dialog === 'terms'} onClose={() => setDialog(null)} />}
    </>
  );
}

function Stat({ label, glossary, value, tone, active, onClick }: {
  label: string;
  glossary?: GlossaryKey;
  value?: number;
  tone?: 'positive' | 'danger';
  active?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {tone && <span aria-hidden className={cn('size-1.5 rounded-full', tone === 'danger' ? 'bg-destructive' : 'bg-success')} />}
        {label}
      </p>
      <p className="stat-value mt-1 font-mono text-xl font-medium tabular-nums tracking-tight sm:text-2xl">{formatCount(value)}</p>
    </>
  );
  const base = 'stat relative border-border px-4 py-3.5 [&:not(:first-child)]:border-l max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(n+3)]:border-t';
  if (!onClick) {
    return glossary
      ? <Term id={glossary} asChild><div className={cn(base, 'cursor-help')} tabIndex={0}>{content}</div></Term>
      : <div className={base}>{content}</div>;
  }
  const toggle = (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          'stat-toggle absolute inset-0 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          active && 'bg-accent/70 shadow-[inset_0_-2px_0_var(--signal)]',
        )}
      >
        <span className="sr-only">{active ? `Remove ${label} filter` : `Filter by ${label}`}</span>
      </button>
  );
  return (
    <div className={base}>
      {glossary ? <Term id={glossary} asChild>{toggle}</Term> : toggle}
      <div className="pointer-events-none relative">{content}</div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-md border bg-card pl-2.5 pr-1 text-xs">
      <span className="max-w-[16rem] truncate">{label}</span>
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
        <X className="size-3" aria-hidden />
      </button>
    </span>
  );
}
