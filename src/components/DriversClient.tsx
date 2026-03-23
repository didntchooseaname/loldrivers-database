'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { toast } from 'sonner';
import SafeDate from '@/components/SafeDate';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import HVCIBlocklistInfo from '@/components/HVCIBlocklistInfo';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ChangelogPopup } from '@/components/ChangelogPopup';
import { TermsPopup } from '@/components/TermsPopup';
import { HelpDialog } from '@/components/HelpDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Download, Cpu, History, Share2, HelpCircle, Search, Eraser, Database,
  Check, Skull, BookOpen, Filter, Shield, ChevronDown, Code2, ShieldCheck,
  ShieldAlert, Clock, ArrowDown, ArrowUp, MemoryStick, Bug, FileCode,
  Terminal, ExternalLink, AlertTriangle, Copy, Network, Settings,
  MoreHorizontal, Loader2, Heart, Github, Scale,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RotateCw, SearchX,
} from 'lucide-react';
import { useDebounce } from '@/hooks/usePerformance';
import { parseFiltersFromURL, serializeFiltersToParams, buildApiUrl } from '@/lib/filters';
import type { Driver, DriversResponse, Stats } from '@/types';

const ITEMS_PER_PAGE = 20;

const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Parse URL params (only on client)
const getInitialUrlParams = () => {
  if (typeof window === 'undefined') {
    return { searchQuery: '', activeFilters: new Set<string>(), currentPage: 1 };
  }
  return parseFiltersFromURL(new URL(window.location.href).searchParams);
};

export default function DriversClient({
  initialDrivers,
  initialStats
}: {
  initialDrivers: DriversResponse;
  initialStats: { success: boolean; stats: Stats };
}) {
  const initialParams = getInitialUrlParams();

  const [searchQuery, setSearchQuery] = useState(initialParams.searchQuery);
  const [inputValue, setInputValue] = useState(initialParams.searchQuery);
  const [activeFilters, setActiveFilters] = useState(initialParams.activeFilters);
  const [pendingFilters, setPendingFilters] = useState(initialParams.activeFilters);
  const [expandedSections, setExpandedSections] = useState(new Set<string>());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [showFilterHelpPopup, setShowFilterHelpPopup] = useState(false);
  const [showAuthentihashHelpPopup, setShowAuthentihashHelpPopup] = useState(false);
  const [showChangelogPopup, setShowChangelogPopup] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [filterAnnouncement, setFilterAnnouncement] = useState('');

  // Help content
  const [helpContent, setHelpContent] = useState<{
    globalHelp: string;
    filterHelp: string;
    authentihashHelp: string;
  } | null>(null);

  // Pagination (now server-side)
  const [currentPage, setCurrentPage] = useState(initialParams.currentPage);

  // Debounced live search (300ms)
  const debouncedInput = useDebounce(inputValue, 300);
  const isFirstRender = useRef(true);

  // When debounced input changes, trigger search
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const trimmed = debouncedInput.trim();
    // Search when user has typed 2+ chars, or cleared the field
    if (trimmed.length >= 2 || trimmed.length === 0) {
      setSearchQuery(trimmed);
      setCurrentPage(1);
    }
  }, [debouncedInput]);

  // Build API URL for SWR (always server-side paginated)
  const apiUrl = useMemo(() =>
    buildApiUrl(activeFilters, searchQuery, currentPage, ITEMS_PER_PAGE),
    [activeFilters, searchQuery, currentPage]
  );

  // Only use SWR when the user has interacted (search, filter, pagination).
  // On initial load, show SSR data directly without any client-side fetch.
  const hasUserInteracted = !!(searchQuery.trim()) || activeFilters.size > 0 || currentPage > 1;
  const swrKey = hasUserInteracted ? apiUrl : null;

  const { data: swrData, isLoading, mutate, error } = useSWR<DriversResponse>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  );

  // Use SWR data when available, otherwise fall back to SSR initial data
  const driversData = swrData || initialDrivers;

  const { data: statsData } = useSWR<{ success: boolean; stats: Stats }>(
    '/api/stats',
    fetcher,
    {
      fallbackData: initialStats,
      revalidateOnFocus: false,
      refreshInterval: 600000,
      revalidateOnMount: false,
    }
  );

  // Drivers come directly from API response (server-paginated)
  const drivers = driversData?.drivers || [];
  const totalItems = driversData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Reset page on filter changes (not on first render)
  const prevFiltersRef = useRef(activeFilters);
  useEffect(() => {
    if (prevFiltersRef.current !== activeFilters) {
      prevFiltersRef.current = activeFilters;
      setCurrentPage(1);
    }
  }, [activeFilters]);

  // Load help content
  useEffect(() => {
    const loadHelpContent = async () => {
      try {
        const response = await fetch('/api/help-content');
        if (response.ok) {
          const content = await response.json();
          setHelpContent(content);
        }
      } catch (error) {
        console.error('Failed to load help content:', error);
      }
    };
    loadHelpContent();
  }, []);

  // Derive certificate status from Signatures[].Certificates[].ValidTo dates.
  // After flatmap, each "driver" IS a single sample with Signatures as a direct property.
  const getCertStatus = (driver: Driver): 'valid' | 'expired' | 'none' => {
    const sigs = driver.Signatures as Array<{ Certificates?: Array<{ ValidTo?: string }> }> | undefined;
    if (!sigs || !Array.isArray(sigs) || sigs.length === 0) return 'none';

    const now = new Date();
    let hasCerts = false;
    let hasValidCert = false;

    for (const sig of sigs) {
      if (!sig.Certificates || !Array.isArray(sig.Certificates)) continue;
      for (const cert of sig.Certificates) {
        hasCerts = true;
        if (cert.ValidTo && new Date(cert.ValidTo) > now) {
          hasValidCert = true;
        }
      }
    }

    if (!hasCerts) return 'none';
    return hasValidCert ? 'valid' : 'expired';
  };

  const hasTrustedCertificate = (driver: Driver): boolean => getCertStatus(driver) === 'valid';
  const hasUntrustedCertificate = (driver: Driver): boolean => getCertStatus(driver) === 'expired';

  // Toggle a pending filter
  const toggleFilter = useCallback((filterType: string) => {
    setPendingFilters(prev => {
      const newFilters = new Set(prev);

      // Mutual exclusion: trusted-cert vs untrusted-cert
      if (filterType === 'trusted-cert' && newFilters.has('untrusted-cert')) {
        newFilters.delete('untrusted-cert');
      } else if (filterType === 'untrusted-cert' && newFilters.has('trusted-cert')) {
        newFilters.delete('trusted-cert');
      }

      // Cert filter mutual exclusions
      if (filterType.startsWith('cert-')) {
        if (filterType === 'cert-valid' && newFilters.has('cert-missing')) newFilters.delete('cert-missing');
        else if (filterType === 'cert-missing' && newFilters.has('cert-valid')) newFilters.delete('cert-valid');

        if (filterType === 'cert-missing') {
          ['cert-expired', 'cert-valid'].forEach(f => newFilters.delete(f));
        }
        if (filterType === 'cert-valid') {
          ['cert-expired', 'cert-missing'].forEach(f => newFilters.delete(f));
        }
        if (['cert-expired'].includes(filterType)) {
          newFilters.delete('cert-valid');
          newFilters.delete('cert-missing');
        }
      }

      // Architecture mutual exclusion
      if (filterType.startsWith('architecture-')) {
        ['architecture-AMD64', 'architecture-I386', 'architecture-ARM64'].forEach(arch => {
          if (arch !== filterType) newFilters.delete(arch);
        });
      }

      // Sort mutual exclusion
      if (filterType === 'newest-first' && newFilters.has('oldest-first')) {
        newFilters.delete('oldest-first');
      } else if (filterType === 'oldest-first' && newFilters.has('newest-first')) {
        newFilters.delete('newest-first');
      }

      if (newFilters.has(filterType)) {
        newFilters.delete(filterType);
      } else {
        newFilters.add(filterType);
      }
      return newFilters;
    });
  }, []);

  const applyFilters = useCallback(() => {
    setActiveFilters(new Set(pendingFilters));
    setFilterAnnouncement('Filters applied. List updated.');
  }, [pendingFilters]);

  useEffect(() => {
    if (!filterAnnouncement) return;
    const t = setTimeout(() => setFilterAnnouncement(''), 2000);
    return () => clearTimeout(t);
  }, [filterAnnouncement]);

  // Apply a filter directly from stat cards (toggle only the clicked filter)
  const applyDirectFilter = useCallback((filterType: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterType)) {
        newFilters.delete(filterType);
      } else {
        newFilters.clear();
        newFilters.add(filterType);
      }
      return newFilters;
    });
    setPendingFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterType)) {
        newFilters.delete(filterType);
      } else {
        newFilters.clear();
        newFilters.add(filterType);
      }
      return newFilters;
    });
    setSearchQuery('');
    setInputValue('');
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setInputValue('');
    setActiveFilters(new Set());
    setPendingFilters(new Set());
  }, []);

  // Explicit search (Enter key or button click)
  const performSearch = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.warning('Please enter a search term');
      return;
    }
    setSearchQuery(trimmed);
    setCurrentPage(1);
  }, [inputValue]);

  // Share current search (copy URL to clipboard)
  const shareCurrentSearch = useCallback(async () => {
    try {
      const url = new URL(window.location.href);
      const params = serializeFiltersToParams(activeFilters, searchQuery, currentPage);
      url.search = params.toString();

      const shareUrl = url.toString();
      window.history.replaceState({}, '', shareUrl);

      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link - please copy manually');
      }
    } catch {
      toast.error('Failed to create share link');
    }
  }, [searchQuery, activeFilters, currentPage]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = parseFiltersFromURL(new URL(window.location.href).searchParams);
      setSearchQuery(urlParams.searchQuery);
      setInputValue(urlParams.searchQuery);
      setActiveFilters(urlParams.activeFilters);
      setPendingFilters(urlParams.activeFilters);
      setCurrentPage(urlParams.currentPage);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL when state changes
  useEffect(() => {
    if (typeof window === 'undefined' || isFirstRender.current) return;

    const params = serializeFiltersToParams(activeFilters, searchQuery, currentPage);
    const url = new URL(window.location.href);
    url.search = params.toString();

    const newUrl = url.toString();
    if (newUrl !== window.location.href) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchQuery, activeFilters, currentPage]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const goToPreviousPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const goToFirstPage = useCallback(() => goToPage(1), [goToPage]);
  const goToLastPage = useCallback(() => goToPage(totalPages), [totalPages, goToPage]);

  // Collapsible section toggle
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) newExpanded.delete(sectionId);
      else newExpanded.add(sectionId);
      return newExpanded;
    });
  }, []);

  // Compact hash row
  const HashRow = ({ type, value, onCopy }: { type: string; value: string; onCopy: () => void }) => (
    <button
      type="button"
      onClick={onCopy}
      className="hash-row flex items-start gap-1.5 rounded px-1.5 py-1 text-left hover:bg-muted/60 transition-colors duration-smooth ease-apple w-full"
      title={`Copy ${type}`}
    >
      <span className="text-[0.625rem] font-medium text-muted-foreground shrink-0 pt-px uppercase tracking-wide">{type}</span>
      <span className="font-mono text-[0.6875rem] break-all text-foreground min-w-0 flex-1 leading-tight">{value}</span>
    </button>
  );

  // Render hash section - show best hash upfront (SHA256 > SHA1 > MD5), rest collapsed
  const renderHashTags = (hashes: { MD5?: string; SHA1?: string; SHA256?: string }, authentihash?: { MD5?: string; SHA1?: string; SHA256?: string }, index?: number) => {
    const copyHash = async (label: string, value: string) => {
      try { await navigator.clipboard.writeText(value); toast.success(`${label} copied!`); }
      catch { toast.error('Failed to copy'); }
    };

    const hasStandard = hashes.MD5 || hashes.SHA1 || hashes.SHA256;
    const hasAuth = authentihash?.MD5 || authentihash?.SHA1 || authentihash?.SHA256;
    if (!hasStandard && !hasAuth) return null;

    // Best hash: SHA256 > SHA1 > MD5
    const primaryHash = hashes.SHA256
      ? { type: 'SHA256', value: hashes.SHA256 }
      : hashes.SHA1
        ? { type: 'SHA1', value: hashes.SHA1 }
        : hashes.MD5
          ? { type: 'MD5', value: hashes.MD5 }
          : null;

    // Extra hashes = all except the primary + authentihashes
    const extras: { type: string; value: string }[] = [];
    if (hashes.SHA256 && primaryHash?.type !== 'SHA256') extras.push({ type: 'SHA256', value: hashes.SHA256 });
    if (hashes.SHA1 && primaryHash?.type !== 'SHA1') extras.push({ type: 'SHA1', value: hashes.SHA1 });
    if (hashes.MD5 && primaryHash?.type !== 'MD5') extras.push({ type: 'MD5', value: hashes.MD5 });
    if (authentihash?.SHA256) extras.push({ type: 'Auth SHA256', value: authentihash.SHA256 });
    if (authentihash?.SHA1) extras.push({ type: 'Auth SHA1', value: authentihash.SHA1 });
    if (authentihash?.MD5) extras.push({ type: 'Auth MD5', value: authentihash.MD5 });

    const hashSectionId = `hashes-${index || 0}`;
    const isExpanded = expandedSections.has(hashSectionId);

    return (
      <div className="card-section">
        {primaryHash && <HashRow type={primaryHash.type} value={primaryHash.value} onCopy={() => copyHash(primaryHash.type, primaryHash.value)} />}

        {extras.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={() => toggleSection(hashSectionId)}>
            <div className="flex items-center gap-1 mt-0.5">
              <CollapsibleTrigger className="flex items-center gap-1 px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-smooth ease-apple" style={{ transform: isExpanded ? 'rotate(180deg)' : undefined }} />
                {isExpanded ? 'Hide' : `+${extras.length} hashes`}
              </CollapsibleTrigger>
              {hasAuth && (
                <button type="button" onClick={() => setShowAuthentihashHelpPopup(true)}
                  className="text-[0.625rem] text-muted-foreground hover:text-foreground transition-colors px-1"
                  title="What are authentihashes?">
                  <HelpCircle className="h-3 w-3 inline" />
                </button>
              )}
            </div>
            <CollapsibleContent>
              <div className="space-y-0.5 mt-0.5">
                {extras.map(h => (
                  <HashRow key={h.type} type={h.type} value={h.value} onCopy={() => copyHash(h.type, h.value)} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  // Generate status tags
  const generateStatusTags = (driver: Driver) => {
    const tags = [];

    // MVDB status: use server-computed _mvdbStatus (single source of truth from CSV)
    const mvdb = (driver as Record<string, unknown>)._mvdbStatus;
    if (mvdb === 'passed') {
      tags.push({ text: 'MVDB PASSED', type: 'success' });
    } else if (mvdb === 'blocked') {
      tags.push({ text: 'MVDB BLOCKED', type: 'danger' });
    }

    if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
      const hasProcessKiller = driver.ImportedFunctions.some(f =>
        f.toLowerCase().includes('zwterminateprocess')
      );
      if (hasProcessKiller) {
        tags.push({ text: 'PROCESS KILLER', type: 'process-killer' });
      }
    }

    if (hasTrustedCertificate(driver)) {
      tags.push({ text: 'VALID CERTIFICATE', type: 'success' });
    } else if (hasUntrustedCertificate(driver)) {
      tags.push({ text: 'EXPIRED CERTIFICATE', type: 'warning' });
    }

    return tags;
  };

  // Generate behavioral capacity tags
  const generateCapacityTags = (driver: Driver) => {
    const capacities = [];

    if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
      const functions = driver.ImportedFunctions.map(f => f.toLowerCase());

      if (functions.some(f => f.includes('zwterminateprocess'))) {
        capacities.push({ text: 'Process Killer', type: 'process-killer' });
      }
      if (functions.some(f =>
        f.includes('zwmap') || f.includes('zwallocate') || f.includes('mmmap') ||
        f.includes('mmallocate') || f.includes('virtualalloc') || f.includes('virtualprotect') ||
        f.includes('heap') || f.includes('pool')
      )) {
        capacities.push({ text: 'Memory Manipulator', type: 'memory-manipulator' });
      }
      if (functions.some(f =>
        f.includes('zwsetinformationprocess') || f.includes('zwsetinformationthread') ||
        f.includes('zwquerysysteminformation') || f.includes('dbgkd') ||
        f.includes('kddebugger') || f.includes('debugport')
      )) {
        capacities.push({ text: 'Debug Bypass', type: 'debug-bypass' });
      }
      if (functions.some(f =>
        f.includes('zwcreatekey') || f.includes('zwopenkey') || f.includes('zwsetvaluekey') ||
        f.includes('zwdeletekey') || f.includes('regcreate') || f.includes('regopen') ||
        f.includes('regset') || f.includes('regdelete')
      )) {
        capacities.push({ text: 'Registry Manipulator', type: 'registry-manipulator' });
      }
      if (functions.some(f =>
        f.includes('zwcreatefile') || f.includes('zwopenfile') || f.includes('zwreadfile') ||
        f.includes('zwwritefile') || f.includes('zwdeletefile') || f.includes('iocreate') ||
        f.includes('ntread') || f.includes('ntwrite')
      )) {
        capacities.push({ text: 'File Manipulator', type: 'file-manipulator' });
      }
    }

    return capacities;
  };

  // Generate certificate tags from Signatures[].Certificates[].ValidTo
  const generateCertificateTags = (driver: Driver) => {
    const status = getCertStatus(driver);
    if (status === 'valid') return [{ text: 'VALID CERTIFICATE', type: 'success' }];
    if (status === 'expired') return [{ text: 'EXPIRED CERTIFICATE', type: 'warning' }];
    return []; // 'none' = no Signatures, don't show a tag
  };

  // Capacity display order
  const CAPACITY_ORDER: Array<{ key: string; text: string; type: string }> = [
    { key: 'process-killer', text: 'Process Killer', type: 'process-killer' },
    { key: 'memory-manipulator', text: 'Memory Manipulator', type: 'memory-manipulator' },
    { key: 'debug-bypass', text: 'Debug Bypass', type: 'debug-bypass' },
    { key: 'registry-manipulator', text: 'Registry Manipulator', type: 'registry-manipulator' },
    { key: 'file-manipulator', text: 'File Manipulator', type: 'file-manipulator' },
  ];

  const renderCapacitiesSection = (capacities: Array<{ text: string; type: string }>) => {
    if (capacities.length === 0) return null;
    const byType = new Set(capacities.map(c => c.type));
    return (
      <div className="card-section">
        <div className="flex flex-wrap gap-1">
          {CAPACITY_ORDER.filter(({ type }) => byType.has(type)).map(({ key, text }) => (
            <Badge key={key} variant="outline" className="text-[0.625rem] px-1.5 py-0 h-5">{text}</Badge>
          ))}
        </div>
      </div>
    );
  };

  const renderStatusTags = (tags: Array<{ text: string; type: string }>) => {
    if (!tags.length) return null;
    const variant = (tag: { text: string; type: string }) =>
      tag.type === 'danger' || tag.type === 'process-killer'
        ? 'destructive'
        : tag.text === 'MVDB PASSED'
          ? 'success'
          : tag.type === 'success'
            ? 'secondary'
            : 'outline';
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <Badge key={index} variant={variant(tag)} className="text-[0.625rem] px-1.5 py-0 h-5">{tag.text}</Badge>
        ))}
      </div>
    );
  };

  // Compact inline section
  const renderSimpleSection = (title: string, content: string) => {
    if (!content || content.toLowerCase() === 'unknown' || content.toLowerCase() === 'no description available') return null;
    return (
      <div className="card-section">
        <p className="text-[0.8125rem] text-muted-foreground leading-snug">
          <span className="text-[0.6875rem] font-medium text-foreground/70 uppercase tracking-wide mr-1.5">{title}</span>
          {content}
        </p>
      </div>
    );
  };

  // Copy function name
  const copyFunctionToClipboard = async (functionName: string) => {
    try {
      await navigator.clipboard.writeText(functionName);
      toast.success(`Function "${functionName}" copied!`);
    } catch {
      toast.error('Failed to copy function');
    }
  };

  // Imported functions section
  const renderImportedFunctionsSection = (functions: string[] | undefined, driver: Driver, index: number) => {
    if (!functions || functions.length === 0) {
      return (
        <div className="card-section">
          <div className="card-section-header">
            <Code2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="card-section-title">Imported Functions</span>
          </div>
          <p className="text-sm text-muted-foreground">No imported functions</p>
        </div>
      );
    }

    const sectionId = `functions-${index}`;
    const isExpanded = expandedSections.has(sectionId);

    // Categorize functions
    const categorizedFunctions: Record<string, string[]> = {
      critical: [], process: [], memory: [], file: [],
      registry: [], network: [], security: [], kernel: [], other: []
    };

    functions.forEach(func => {
      const fl = func.toLowerCase();
      if (fl.includes('zwterminateprocess')) categorizedFunctions.critical.push(func);
      else if (fl.includes('process') || fl.includes('thread') || fl.includes('zwcreate') || fl.includes('zwopen') || fl.includes('pscreate') || fl.includes('psget')) categorizedFunctions.process.push(func);
      else if (fl.includes('memory') || fl.includes('virtual') || fl.includes('mmmap') || fl.includes('mmallocate') || fl.includes('zwmap') || fl.includes('zwallocate') || fl.includes('heap') || fl.includes('pool')) categorizedFunctions.memory.push(func);
      else if (fl.includes('file') || fl.includes('directory') || fl.includes('zwread') || fl.includes('zwwrite') || fl.includes('zwdelete') || fl.includes('iocreate') || fl.includes('ntread') || fl.includes('ntwrite')) categorizedFunctions.file.push(func);
      else if (fl.includes('registry') || fl.includes('regopen') || fl.includes('regcreate') || fl.includes('regset') || fl.includes('regquery') || (fl.includes('zwopen') && fl.includes('key')) || (fl.includes('zwcreate') && fl.includes('key'))) categorizedFunctions.registry.push(func);
      else if (fl.includes('socket') || fl.includes('wsk') || fl.includes('network') || fl.includes('tcp') || fl.includes('udp') || fl.includes('tdi')) categorizedFunctions.network.push(func);
      else if (fl.includes('security') || fl.includes('token') || fl.includes('privilege') || fl.includes('seaccess') || fl.includes('seaudit') || fl.includes('sesingle') || (fl.includes('zwsetinformation') && fl.includes('token'))) categorizedFunctions.security.push(func);
      else if (fl.includes('ke') || fl.includes('hal') || fl.includes('io') || fl.includes('ob') || fl.includes('ex') || fl.includes('rtl') || fl.includes('zwquery') || fl.includes('zwset') || fl.includes('ntquery') || fl.includes('ntset')) categorizedFunctions.kernel.push(func);
      else categorizedFunctions.other.push(func);
    });

    const renderFuncCategory = (categoryKey: string, label: string, Icon: React.ComponentType<{ className?: string }>, funcs: string[], danger?: boolean) =>
      funcs.length > 0 ? (
        <Collapsible key={categoryKey} open={expandedSections.has(categoryKey)} onOpenChange={() => toggleSection(categoryKey)}>
          <CollapsibleTrigger className="func-cat-trigger group flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-2.5 py-2 text-left text-xs font-medium transition-colors duration-smooth ease-apple hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=open]:border-ring/50">
            <span className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              {label} ({funcs.length})
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-smooth ease-apple group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="func-list mt-1.5 space-y-0.5 rounded-md border border-border bg-muted/20 p-1.5">
              {funcs.map((func, idx) => (
                <li key={`${categoryKey}-${idx}`}>
                  <button type="button" onClick={() => copyFunctionToClipboard(func)} title={`Copy ${func}`}
                    className={`func-row flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs font-mono transition-colors duration-smooth ease-apple hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${danger ? 'text-destructive' : 'text-foreground'}`}>
                    <span className="min-w-0 truncate">{func}</span>
                    <Copy className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null;

    return (
      <div className="card-section" key={sectionId}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleSection(sectionId)}>
          <CollapsibleTrigger className="collapsible-trigger group flex w-full items-center justify-between gap-2 text-left text-sm font-medium">
            <span className="flex items-center gap-2">
              <Code2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              Imported Functions ({functions.length})
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-smooth ease-apple group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="collapsible-content-block pt-3 space-y-2">
              {renderFuncCategory(`critical-${index}`, 'Critical', AlertTriangle, categorizedFunctions.critical, true)}
              {renderFuncCategory(`process-${index}`, 'Process', Cpu, categorizedFunctions.process)}
              {renderFuncCategory(`memory-${index}`, 'Memory', MemoryStick, categorizedFunctions.memory)}
              {renderFuncCategory(`file-${index}`, 'File system', FileCode, categorizedFunctions.file)}
              {renderFuncCategory(`registry-${index}`, 'Registry', Database, categorizedFunctions.registry)}
              {renderFuncCategory(`network-${index}`, 'Network', Network, categorizedFunctions.network)}
              {renderFuncCategory(`security-${index}`, 'Security', Shield, categorizedFunctions.security)}
              {renderFuncCategory(`kernel-${index}`, 'Kernel/System', Settings, categorizedFunctions.kernel)}
              {renderFuncCategory(`other-${index}`, 'Other', MoreHorizontal, categorizedFunctions.other)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Resources section
  const renderResourcesSection = (resources: string[] | undefined, driver: Driver, index: number) => {
    if (!resources || resources.length === 0) return null;

    const filteredResources = resources.filter(resource => {
      if (!resource || !resource.trim()) return false;
      const lr = resource.toLowerCase();
      return !lr.includes('internal research') && !lr.includes('internal-research') && !lr.includes('internal_research');
    });
    if (filteredResources.length === 0) return null;

    const sectionId = `resources-${index}`;
    const isExpanded = expandedSections.has(sectionId);

    return (
      <div className="card-section" key={sectionId}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleSection(sectionId)}>
          <CollapsibleTrigger className="collapsible-trigger group flex w-full items-center justify-between gap-2 text-left text-sm font-medium">
            <span className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              Resources ({filteredResources.length})
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-smooth ease-apple group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="collapsible-content-block space-y-1.5 pt-3">
              {filteredResources.map((resource, ri) => {
                if (!resource?.trim()) return null;
                let domain = '';
                let displayName = resource;
                try {
                  const url = new URL(resource);
                  domain = url.hostname;
                  displayName = `${domain}${url.pathname}`;
                  if (displayName.length > 60) displayName = displayName.substring(0, 57) + '...';
                } catch {
                  displayName = resource.length > 60 ? resource.substring(0, 57) + '...' : resource;
                }
                const faviconUrl = domain && domain.length > 0 && domain.length < 100
                  ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16` : null;
                return (
                  <a key={`resource-${ri}`} href={resource} target="_blank" rel="noopener noreferrer"
                    className="resource-link flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors duration-smooth ease-apple" title={resource}>
                    {faviconUrl ? (
                      <Image src={faviconUrl} alt="" width={14} height={14} className="shrink-0" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span className="truncate">{displayName}</span>
                  </a>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Commands section
  const renderCommandsSection = (commands: Driver['Commands'], driver: Driver, index: number) => {
    if (!commands || typeof commands !== 'object') return null;

    const sectionId = `commands-${index}`;
    const isExpanded = expandedSections.has(sectionId);

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => toast.success('Command copied!')).catch(() => toast.error('Failed to copy'));
    };

    return (
      <div className="card-section" key={sectionId}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleSection(sectionId)}>
          <CollapsibleTrigger className="collapsible-trigger group flex w-full items-center justify-between gap-2 text-left text-sm font-medium">
            <span className="flex items-center gap-2">
              <Terminal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              Commands & Usage
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-smooth ease-apple group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="collapsible-content-block space-y-3 pt-3">
              {commands.OperatingSystem && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Operating System</p>
                  <p className="text-sm">{commands.OperatingSystem}</p>
                </div>
              )}
              {commands.Privileges && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Privileges</p>
                  <p className="text-sm">{commands.Privileges}</p>
                </div>
              )}
              {commands.Usecase && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Use Case</p>
                  <p className="text-sm">{commands.Usecase}</p>
                </div>
              )}
              {commands.Command?.trim() && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Command</p>
                  <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50">
                      <span className="text-xs text-muted-foreground">Terminal</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(commands.Command || '')} title="Copy command">
                        <Copy className="h-3 w-3 text-muted-foreground" aria-hidden />
                      </Button>
                    </div>
                    <pre className="p-3 text-xs font-mono overflow-x-auto"><code>{commands.Command}</code></pre>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Best description
  const getBestDescription = (driver: Driver): string => {
    const driverDesc = driver.Description || '';
    const commandDesc = driver.Commands?.Description || '';
    if (!driverDesc && !commandDesc) return 'No description available';
    if (!driverDesc) return commandDesc;
    if (!commandDesc) return driverDesc;
    if (commandDesc.length > driverDesc.length * 1.2) return commandDesc;
    return driverDesc;
  };

  // Download driver
  const downloadDriver = useCallback((driver: Driver) => {
    const hash = driver.MD5;
    const filename = getDriverName(driver);
    if (!hash) {
      toast.error('No MD5 hash available for download');
      return;
    }
    const downloadUrl = `https://github.com/magicsword-io/LOLDrivers/raw/main/drivers/${hash}.bin`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    link.style.display = 'none';
    document.body.insertAdjacentElement('beforeend', link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${filename}...`);
  }, []);

  const formatArchitecture = (machineType: string | undefined): string | null => {
    if (!machineType) return null;
    switch (machineType.toUpperCase()) {
      case 'AMD64': return 'x64';
      case 'I386': return 'x32';
      case 'ARM64': return 'ARM64';
      default: return machineType.toLowerCase();
    }
  };

  const getDriverName = (driver: Driver): string => {
    if (driver.OriginalFilename && driver.OriginalFilename.toLowerCase() !== 'unknown') return driver.OriginalFilename;
    if (driver.Filename && driver.Filename.toLowerCase() !== 'unknown') return driver.Filename;
    if (driver.Tags && Array.isArray(driver.Tags) && driver.Tags.length > 0 && driver.Tags[0]?.trim()) return driver.Tags[0];
    return 'Unknown Driver';
  };

  const isProcessKiller = (d: Driver) =>
    d.ImportedFunctions?.some((f) => f.toLowerCase().includes('zwterminateprocess')) ?? false;

  // Driver card
  const createDriverCard = (driver: Driver, index: number) => {
    const hashes = { MD5: driver.MD5, SHA1: driver.SHA1, SHA256: driver.SHA256 };
    const statusTags = generateStatusTags(driver);
    const capacityTags = generateCapacityTags(driver);
    const certificateTags = generateCertificateTags(driver);
    const filename = getDriverName(driver);
    const formattedArch = formatArchitecture(driver.MachineType as string);
    const danger = isProcessKiller(driver);

    return (
      <Card
        key={`driver-${index}-${driver.MD5 || driver.SHA256}`}
        className={`driver-card flex h-full flex-col overflow-hidden ${danger ? 'driver-card--danger border-l-[3px] border-l-destructive' : ''}`}
      >
        <CardHeader className="shrink-0 px-3 pt-3 pb-2">
          {/* Top row: name + arch + download */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h3 className="text-[0.8125rem] font-semibold leading-tight tracking-tight truncate">{filename}</h3>
                {formattedArch && <span className="text-[0.625rem] text-muted-foreground font-mono shrink-0">{formattedArch}</span>}
              </div>
              {(driver.Company || driver.Created) && (
                <p className="text-[0.6875rem] text-muted-foreground mt-0.5 truncate">
                  {[driver.Company, driver.Created].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => downloadDriver(driver)} title={`Download ${filename}`} aria-label={`Download ${filename}`}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
          {/* Badges row */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {renderStatusTags(statusTags)}
            {certificateTags.length > 0 && renderStatusTags(certificateTags)}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col min-h-0 px-3 pt-0 pb-3 space-y-0">
          {renderHashTags(hashes, driver.Authentihash, index)}
          {renderSimpleSection('Description', getBestDescription(driver))}
          {renderCapacitiesSection(capacityTags)}
          {renderCommandsSection(driver.Commands, driver, index)}
          {renderImportedFunctionsSection(driver.ImportedFunctions, driver, index)}
          {renderResourcesSection(driver.Resources, driver, index)}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-top flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="header-content">
            <h1 className="text-xl sm:text-2xl font-bold">LOLDrivers Database</h1>
            <p className="header-subtitle">Vulnerable and malicious Windows drivers database</p>
            <p className="last-updated">
              <SafeDate date={statsData?.stats?.lastUpdated || null} prefix="Last updated: " fallback="Loading..." />
            </p>
          </div>
          <div className="header-controls flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowChangelogPopup(true)} title="View changelog" aria-label="View changelog">
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={shareCurrentSearch} title="Share current search" aria-label="Share current search">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowHelpPopup(true)} aria-label="Help" title="Help">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <ThemeSwitcher />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stats-section">
          <div className="stat-item flex flex-col gap-0.5">
            <span className="stat-label flex items-center gap-1.5"><Database className="h-3.5 w-3.5 opacity-70" /> Total Drivers</span>
            <span className="stat-value">{statsData?.stats?.total || 0}</span>
          </div>
          <div role="button" tabIndex={0}
            className={`stat-item clickable flex flex-col gap-0.5 ${activeFilters.has('hvci') ? 'active' : ''}`}
            onClick={() => applyDirectFilter('hvci')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), applyDirectFilter('hvci'))}>
            <span className="stat-label flex items-center gap-1.5"><Check className="h-3.5 w-3.5 opacity-70" /> MVDB Passed</span>
            <span className="stat-value">{statsData?.stats?.hvciCompatible || 0}</span>
          </div>
          <div role="button" tabIndex={0}
            className={`stat-item clickable process-killer-item flex flex-col gap-0.5 ${activeFilters.has('process-killer') ? 'active' : ''}`}
            onClick={() => applyDirectFilter('process-killer')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), applyDirectFilter('process-killer'))}>
            <span className="stat-label flex items-center gap-1.5"><Skull className="h-3.5 w-3.5 opacity-70" /> Process Killer Drivers</span>
            <span className="stat-value">{statsData?.stats?.processKillerDrivers || 0}</span>
          </div>
        </div>

        <HVCIBlocklistInfo stats={statsData?.stats} />
      </header>

      <div className="search-section">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              id="driver-search" name="search" type="text"
              placeholder="Search drivers by name, hash, company, description..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              disabled={isLoading}
              className="h-10"
              aria-label="Search drivers by name, hash, company, or description"
            />
          </div>
          <Button onClick={performSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
          <Button variant="outline" onClick={clearAllFilters} disabled={!searchQuery.trim() && activeFilters.size === 0}>
            <Eraser className="h-4 w-4" /> Clear
          </Button>
        </div>

        <div className="filter-options">
          <div className="filter-group">
            <span className="filter-label">Quick Filters:</span>
            <Button variant={pendingFilters.has('hvci') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('hvci')}>
              <Check className="h-3.5 w-3.5" /> MVDB Passed
            </Button>
            <Button variant={pendingFilters.has('trusted-cert') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('trusted-cert')} disabled={pendingFilters.has('untrusted-cert')}>
              <ShieldCheck className="h-3.5 w-3.5" /> Trusted Certificate
            </Button>
            <Button variant={pendingFilters.has('untrusted-cert') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('untrusted-cert')} disabled={pendingFilters.has('trusted-cert')}>
              <ShieldAlert className="h-3.5 w-3.5" /> Unknown Certificate
            </Button>
            <Button variant={pendingFilters.has('recent') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('recent')}>
              <Clock className="h-3.5 w-3.5" /> Recent Drivers
            </Button>
            <Button variant={pendingFilters.has('newest-first') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('newest-first')} disabled={pendingFilters.has('oldest-first')}>
              <ArrowDown className="h-3.5 w-3.5" /> Newest First
            </Button>
            <Button variant={pendingFilters.has('oldest-first') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('oldest-first')} disabled={pendingFilters.has('newest-first')}>
              <ArrowUp className="h-3.5 w-3.5" /> Oldest First
            </Button>
          </div>
          <div className="filter-group advanced-filters">
            <span className="filter-label">Behaviors:</span>
            <Button variant={pendingFilters.has('process-killer') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('process-killer')}>
              <Skull className="h-3.5 w-3.5" /> Process Killer
            </Button>
            <Button variant={pendingFilters.has('memory-manipulator') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('memory-manipulator')}>
              <MemoryStick className="h-3.5 w-3.5" /> Memory Manipulator
            </Button>
            <Button variant={pendingFilters.has('debug-bypass') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('debug-bypass')}>
              <Bug className="h-3.5 w-3.5" /> Debug Bypass
            </Button>
            <Button variant={pendingFilters.has('registry-manipulator') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('registry-manipulator')}>
              <Database className="h-3.5 w-3.5" /> Registry Manipulator
            </Button>
            <Button variant={pendingFilters.has('file-manipulator') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('file-manipulator')}>
              <FileCode className="h-3.5 w-3.5" /> File Manipulator
            </Button>
          </div>

          <div className="filter-group certificate-filters">
            <span className="filter-label">Certificates:</span>
            <Button variant={pendingFilters.has('cert-expired') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('cert-expired')} disabled={pendingFilters.has('cert-missing')}>
              <Clock className="h-3.5 w-3.5" /> Expired
            </Button>
            <Button variant={pendingFilters.has('cert-valid') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('cert-valid')} disabled={pendingFilters.has('cert-missing') || pendingFilters.has('cert-expired')}>
              <Check className="h-3.5 w-3.5" /> Valid
            </Button>
            <Button variant={pendingFilters.has('cert-missing') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('cert-missing')} disabled={pendingFilters.has('cert-valid') || pendingFilters.has('cert-expired')}>
              <HelpCircle className="h-3.5 w-3.5" /> No Cert
            </Button>
          </div>

          <div className="filter-group meta-filters">
            <span className="filter-label">Architecture:</span>
            <Button variant={pendingFilters.has('architecture-AMD64') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('architecture-AMD64')}>
              <Cpu className="h-3.5 w-3.5" /> x64
            </Button>
            <Button variant={pendingFilters.has('architecture-I386') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('architecture-I386')}>
              <Cpu className="h-3.5 w-3.5" /> x32
            </Button>
            <Button variant={pendingFilters.has('architecture-ARM64') ? 'secondary' : 'outline'} size="sm" onClick={() => toggleFilter('architecture-ARM64')}>
              <Cpu className="h-3.5 w-3.5" /> arm64
            </Button>
          </div>
          <div className="filter-group control-filters">
            <Button onClick={applyFilters} disabled={pendingFilters.size === 0 && searchQuery.trim() === ''} size="sm">
              <Check className="h-3.5 w-3.5" /> Apply Filters
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAllFilters} disabled={!searchQuery.trim() && activeFilters.size === 0}>
              <Eraser className="h-3.5 w-3.5" /> Clear Filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilterHelpPopup(true)} title="How filters work">
              <HelpCircle className="h-3.5 w-3.5" /> Filter Help
            </Button>
          </div>
        </div>
        <p className="filter-apply-hint text-xs text-muted-foreground mt-1.5">
          Changes apply when you click Apply Filters. Live search activates as you type.
        </p>
        <div aria-live="polite" aria-atomic="true" className="sr-only">{filterAnnouncement}</div>

        {isLoading && (
          <div className="loading-bar-container">
            <div className="loading-bar"><div className="loading-bar-progress"></div></div>
            <span className="loading-bar-text">Searching drivers...</span>
          </div>
        )}

        {error && (
          <div className="error-bar-container">
            <div className="error-message">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Search failed. Please try again.</span>
              <button className="retry-button" onClick={() => mutate()} title="Retry search">
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="search-stats mb-4">
          <span>
            {isLoading
              ? 'Searching...'
              : `Showing ${Math.min(ITEMS_PER_PAGE, drivers.length)} of ${totalItems} drivers (Page ${currentPage} of ${totalPages})`
            }
          </span>
          {(searchQuery || activeFilters.size > 0) && <span className="server-search-indicator"> (Server-side search)</span>}
          {error && <span className="error-indicator"> (Error occurred)</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 drivers-grid items-stretch">
        {!isLoading && drivers.length > 0 ? (
          drivers.map((driver, index) => {
            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
            return createDriverCard(driver, globalIndex);
          })
        ) : !isLoading ? (
          <div className="empty-state col-span-full">
            <SearchX className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3>No drivers found</h3>
            <p className="mt-1">Try adjusting your search term or clearing some filters.</p>
            {(searchQuery || activeFilters.size > 0) && (
              <Button variant="outline" size="sm" className="mt-3" onClick={clearAllFilters}>
                <Eraser className="h-3.5 w-3.5" /> Clear all filters
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination">
            <button className="pagination-btn" onClick={goToFirstPage} disabled={currentPage === 1} aria-label="First page">
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button className="pagination-btn" onClick={goToPreviousPage} disabled={currentPage === 1} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="pagination-numbers">
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                const endPage = Math.min(totalPages, startPage + maxVisible - 1);
                if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button key={i} className={`pagination-number ${i === currentPage ? 'active' : ''}`}
                      onClick={() => goToPage(i)} aria-label={`Page ${i}`}>{i}</button>
                  );
                }
                return pages;
              })()}
            </div>

            <button className="pagination-btn" onClick={goToNextPage} disabled={currentPage === totalPages} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button className="pagination-btn" onClick={goToLastPage} disabled={currentPage === totalPages} aria-label="Last page">
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
          <div className="pagination-indicator">Page {currentPage} of {totalPages}</div>
        </div>
      )}

      {/* Back to Top */}
      {showBackToTop && (
        <Button size="icon" className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 back-to-top-enter" onClick={scrollToTop} aria-label="Back to top">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </Button>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__grid">
            <section className="footer__block" aria-labelledby="footer-thanks">
              <h2 id="footer-thanks" className="footer__heading"><Heart className="footer__icon" aria-hidden /> Special Thanks</h2>
              <p className="footer__text">
                This database is based on the amazing work from the{' '}
                <a href="https://loldrivers.io" target="_blank" rel="noopener noreferrer" className="footer__link">LOLDrivers.io</a>{' '}
                project and its contributors.
              </p>
            </section>
            <section className="footer__block" aria-labelledby="footer-source">
              <h2 id="footer-source" className="footer__heading"><Github className="footer__icon" aria-hidden /> Source & Contributors</h2>
              <p className="footer__text">
                Original project:{' '}
                <a href="https://github.com/magicsword-io/LOLDrivers" target="_blank" rel="noopener noreferrer" className="footer__link">
                  <Github className="footer__icon-inline" aria-hidden /> magicsword-io/LOLDrivers
                </a>
              </p>
              <p className="footer__text">
                This project:{' '}
                <a href="https://github.com/didntchooseaname/loldrivers-database" target="_blank" rel="noopener noreferrer" className="footer__link">
                  <Github className="footer__icon-inline" aria-hidden /> didntchooseaname/loldrivers-database
                </a>
              </p>
            </section>
          </div>
          <div className="footer__bar">
            <p className="footer__disclaimer">Independent interface for educational and research purposes.</p>
            <div className="footer__actions">
              <button type="button" onClick={() => setShowTermsPopup(true)} className="footer__legal">
                <Scale className="footer__icon-inline" aria-hidden /> Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Help Dialog */}
      <HelpDialog open={showHelpPopup} onOpenChange={setShowHelpPopup}
        title="About LOLDrivers Database" description="Technical definitions, project vision, and key terms."
        icon={<BookOpen className="h-5 w-5 text-muted-foreground" />}>
        {helpContent ? <MarkdownRenderer content={helpContent.globalHelp} /> : <p className="text-muted-foreground">Loading help content...</p>}
      </HelpDialog>

      {/* Filter Help Dialog */}
      <HelpDialog open={showFilterHelpPopup} onOpenChange={setShowFilterHelpPopup}
        title="Filter Help – How Each Filter Works" description="Explanation of each filter option."
        icon={<Filter className="h-5 w-5 text-muted-foreground" />}>
        {helpContent ? <MarkdownRenderer content={helpContent.filterHelp} /> : <p className="text-muted-foreground">Loading filter help...</p>}
      </HelpDialog>

      {/* Authentihash Help Dialog */}
      <HelpDialog open={showAuthentihashHelpPopup} onOpenChange={setShowAuthentihashHelpPopup}
        title="Authentihash Information" description="What authentihashes are and how they are used."
        icon={<Shield className="h-5 w-5 text-muted-foreground" />} showScrollIndicator={false}>
        {helpContent ? <MarkdownRenderer content={helpContent.authentihashHelp} /> : <p className="text-muted-foreground">Loading...</p>}
      </HelpDialog>

      <ChangelogPopup isVisible={showChangelogPopup} onClose={() => setShowChangelogPopup(false)} />
      <TermsPopup isVisible={showTermsPopup} onClose={() => setShowTermsPopup(false)} />
    </div>
  );
}
