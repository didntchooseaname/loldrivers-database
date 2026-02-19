'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { toast } from 'sonner';
import SafeDate from '@/components/SafeDate';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Download, Cpu, History, Share2, HelpCircle, Search, Eraser, Database, Check, Skull, BookOpen, Filter, Shield, ChevronDown, Code2, ShieldCheck, ShieldAlert, Clock, ArrowDown, ArrowUp, MemoryStick, Bug, FileCode, Terminal, ExternalLink, AlertTriangle, Copy, Network, Settings, MoreHorizontal, Loader2, Heart, Github, Scale } from 'lucide-react';
import type { Driver, DriversResponse, Stats } from '@/types';

const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
  
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Extract initial URL parameters
const getInitialUrlParams = () => {
  if (typeof window === 'undefined') {
    return { searchQuery: '', activeFilters: new Set<string>(), currentPage: 1 };
  }
  
  const url = new URL(window.location.href);
  const params = url.searchParams;
  
  // Extract search query
  const searchQuery = params.get('q') || '';
  
  // Extract filters
  const activeFilters = new Set<string>();
  if (params.get('hvci') === 'true') activeFilters.add('hvci');
  if (params.get('killer') === 'true') activeFilters.add('killer');
  if (params.get('trusted-cert') === 'true') activeFilters.add('trusted-cert');
  if (params.get('untrusted-cert') === 'true') activeFilters.add('untrusted-cert');
  if (params.get('recent') === 'true') activeFilters.add('recent');
  if (params.get('newest-first') === 'true') activeFilters.add('newest-first');
  if (params.get('oldest-first') === 'true') activeFilters.add('oldest-first');
  
  // Certificate validation filters
  if (params.get('cert-revoked') === 'true') activeFilters.add('cert-revoked');
  if (params.get('cert-expired') === 'true') activeFilters.add('cert-expired');
  if (params.get('cert-suspicious') === 'true') activeFilters.add('cert-suspicious');
  if (params.get('cert-valid') === 'true') activeFilters.add('cert-valid');
  if (params.get('cert-missing') === 'true') activeFilters.add('cert-missing');
  
  // Behavioral filters
  if (params.get('memory-manipulator') === 'true') activeFilters.add('memory-manipulator');
  if (params.get('process-killer') === 'true') activeFilters.add('process-killer');
  if (params.get('debug-bypass') === 'true') activeFilters.add('debug-bypass');
  if (params.get('registry-manipulator') === 'true') activeFilters.add('registry-manipulator');
  if (params.get('file-manipulator') === 'true') activeFilters.add('file-manipulator');
  
  // Architecture filter
  const architecture = params.get('architecture');
  if (architecture && ['AMD64', 'I386', 'ARM64'].includes(architecture)) {
    activeFilters.add(`architecture-${architecture}`);
  }
  
  // Extract page number
  const pageParam = params.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) || 1 : 1;
  
  return { searchQuery, activeFilters, currentPage };
};

export default function DriversClient({ 
  initialDrivers, 
  initialStats 
}: { 
  initialDrivers: DriversResponse;
  initialStats: { success: boolean; stats: Stats };
}) {
  // Initialize with URL parameters
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
  const openAuthentihashHelp = useCallback(() => setShowAuthentihashHelpPopup(true), []);
  const [showChangelogPopup, setShowChangelogPopup] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showFilterHelpScrollIndicator, setShowFilterHelpScrollIndicator] = useState(true);
  const [filterAnnouncement, setFilterAnnouncement] = useState('');
  
  // Help content state
  const [helpContent, setHelpContent] = useState<{
    globalHelp: string;
    filterHelp: string;
    authentihashHelp: string;
  } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialParams.currentPage);
  const ITEMS_PER_PAGE = 20;

  // Server-side search with SWR
  const searchKey = useMemo(() => {
    if (!searchQuery.trim() && activeFilters.size === 0) {
      return null; // No search, use initial data
    }
    
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery);
    if (activeFilters.has('hvci')) params.set('hvci', 'true');
    if (activeFilters.has('killer')) params.set('killer', 'true');
    if (activeFilters.has('trusted-cert')) params.set('trusted-cert', 'true');
    if (activeFilters.has('untrusted-cert')) params.set('untrusted-cert', 'true');
    if (activeFilters.has('recent')) params.set('recent', 'true');
    if (activeFilters.has('newest-first')) params.set('newest-first', 'true');
    if (activeFilters.has('oldest-first')) params.set('oldest-first', 'true');
    
    // Certificate validation filters
    if (activeFilters.has('cert-revoked')) params.set('cert-revoked', 'true');
    if (activeFilters.has('cert-expired')) params.set('cert-expired', 'true');
    if (activeFilters.has('cert-suspicious')) params.set('cert-suspicious', 'true');
    if (activeFilters.has('cert-valid')) params.set('cert-valid', 'true');
    if (activeFilters.has('cert-missing')) params.set('cert-missing', 'true');
    
    // Behavioral filters
    if (activeFilters.has('memory-manipulator')) params.set('memory-manipulator', 'true');
    if (activeFilters.has('process-killer')) params.set('process-killer', 'true');
    if (activeFilters.has('debug-bypass')) params.set('debug-bypass', 'true');
    if (activeFilters.has('registry-manipulator')) params.set('registry-manipulator', 'true');
    if (activeFilters.has('file-manipulator')) params.set('file-manipulator', 'true');
    
    // Architecture filter
    if (activeFilters.has('architecture-AMD64')) params.set('architecture', 'AMD64');
    if (activeFilters.has('architecture-I386')) params.set('architecture', 'I386');
    if (activeFilters.has('architecture-ARM64')) params.set('architecture', 'ARM64');
    
    return `/api/drivers?${params.toString()}`;
  }, [searchQuery, activeFilters]);

  const { data: searchData, isLoading, mutate, error } = useSWR<DriversResponse>(
    searchKey,
    searchKey ? fetcher : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      revalidateOnMount: false,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  );

  const { data: statsData } = useSWR<{ success: boolean; stats: Stats }>(
    '/api/stats',
    fetcher,
    {
      fallbackData: initialStats,
      revalidateOnFocus: false,
      refreshInterval: 600000, // 10 minutes
      revalidateOnMount: false,
    }
  );

  // Memoize drivers to display
  const allDrivers = useMemo(() => {
    if (searchKey && searchData) {
      return searchData.drivers || [];
    }
    return initialDrivers.drivers || [];
  }, [searchKey, searchData, initialDrivers.drivers]);

  // Pagination calculations
  const totalItems = allDrivers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  // Paginated drivers for current page
  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allDrivers.slice(startIndex, endIndex);
  }, [allDrivers, currentPage, ITEMS_PER_PAGE]);

  // Track if this is the first render
  const isFirstRender = useRef(true);

  // Reset to page 1 when filters or search change (except first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, activeFilters]);

  // Force revalidation when activeFilters change
  useEffect(() => {
    if (isFirstRender.current) {
      return;
    }
    if (mutate) {
      mutate();
    }
  }, [activeFilters, mutate]);

  // Load help content from markdown files
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

  // Initialize critical sections as expanded by default
  useEffect(() => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      // Marquer toutes les sections critiques comme non-collapsed au premier rendu
      paginatedDrivers.forEach((driver, index) => {
        if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
          const hasCriticalFunctions = driver.ImportedFunctions.some(func => {
            const funcLower = func.toLowerCase();
            return funcLower.includes('zwterminateprocess');
          });
          
          if (hasCriticalFunctions) {
            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
            newExpanded.add(`critical-${globalIndex}`);
          }
        }
      });
      return newExpanded;
    });
  }, [paginatedDrivers, currentPage, ITEMS_PER_PAGE]);

  // Check active certificate using CertificateStatus
  const hasActiveCertificate = (driver: Driver): boolean => {
    if (!driver.KnownVulnerableSamples || !Array.isArray(driver.KnownVulnerableSamples)) {
      return false;
    }

    return driver.KnownVulnerableSamples.some(sample => {
      if (sample && typeof sample === 'object' && sample.CertificateStatus) {
        const status = sample.CertificateStatus;
        // Consider Valid certificates as "active" (not expired or revoked)
        return status === 'Valid';
      }
      return false;
    });
  };

  // Check if driver has valid trusted certificate using CertificateStatus
  const hasTrustedCertificate = (driver: Driver): boolean => {
    if (!driver.KnownVulnerableSamples || !Array.isArray(driver.KnownVulnerableSamples)) {
      return false;
    }

    return driver.KnownVulnerableSamples.some(sample => {
      if (sample && typeof sample === 'object' && sample.CertificateStatus) {
        return sample.CertificateStatus === 'Valid';
      }
      return false;
    });
  };

  // Check if driver has suspicious certificate (expired, self-signed, etc.)
  const hasUntrustedCertificate = (driver: Driver): boolean => {
    if (!driver.KnownVulnerableSamples || !Array.isArray(driver.KnownVulnerableSamples)) {
      return false;
    }

    return driver.KnownVulnerableSamples.some(sample => {
      if (sample && typeof sample === 'object' && sample.CertificateStatus) {
        const status = sample.CertificateStatus;
        // Consider these statuses as "untrusted"
        return status === 'Expired' || status === 'Revoked' || status === 'Invalid' || status === 'Unknown';
      }
      return false;
    });
  };

  // Gestion des filtres
  const toggleFilter = useCallback((filterType: string) => {
    setPendingFilters(prev => {
      const newFilters = new Set(prev);
      
      // Logique pour les filtres de certificats mutuellement exclusifs
      if (filterType === 'trusted-cert' && newFilters.has('untrusted-cert')) {
        newFilters.delete('untrusted-cert');
      } else if (filterType === 'untrusted-cert' && newFilters.has('trusted-cert')) {
        newFilters.delete('trusted-cert');
      }
      
      // Logique d'exclusivité intelligente pour les filtres de certificat
      if (filterType.startsWith('cert-')) {
        // Groupe d'exclusivité: Valid vs Missing (mutuellement exclusif)
        if (filterType === 'cert-valid' && newFilters.has('cert-missing')) {
          newFilters.delete('cert-missing');
        } else if (filterType === 'cert-missing' && newFilters.has('cert-valid')) {
          newFilters.delete('cert-valid');
        }
        
        // Si on active cert-missing, désactiver tous les autres filtres de problèmes
        // (pas de certificat = pas de problèmes de certificat)
        if (filterType === 'cert-missing') {
          ['cert-expired', 'cert-valid'].forEach(filter => {
            newFilters.delete(filter);
          });
        }
        
        // Si on active cert-valid, désactiver les filtres de problèmes incompatibles
        // (un certificat valide ne peut pas être expiré)
        if (filterType === 'cert-valid') {
          ['cert-expired', 'cert-missing'].forEach(filter => {
            newFilters.delete(filter);
          });
        }
        
        // Si on active un problème majeur (expired), désactiver cert-valid
        if (['cert-expired'].includes(filterType)) {
          newFilters.delete('cert-valid');
          newFilters.delete('cert-missing');
        }
      }
      
      // Logic for mutually exclusive verification filters
      // Logic for mutually exclusive architecture filters
      if (filterType.startsWith('architecture-')) {
        // Remove all other architecture filters
        ['architecture-AMD64', 'architecture-I386', 'architecture-ARM64'].forEach(arch => {
          if (arch !== filterType) {
            newFilters.delete(arch);
          }
        });
      }
      
      // Logique pour les filtres de tri mutuellement exclusifs
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

  // Fonction pour appliquer directement un filtre depuis le header
  const applyDirectFilter = useCallback((filterType: string) => {
    // If filter is already active, disable it (toggle)
    if (activeFilters.has(filterType)) {
      setActiveFilters(new Set());
      setPendingFilters(new Set());
      setSearchQuery('');
      setInputValue('');
    } else {
      // Sinon, clear other filters and apply only this one
      const newFilters = new Set([filterType]);
      setActiveFilters(newFilters);
      setPendingFilters(newFilters);
      // Clear search query to show only filtered results
      setSearchQuery('');
      setInputValue('');
    }
    // Forcer la revalidation SWR
    if (mutate) {
      mutate();
    }
  }, [activeFilters, mutate]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setInputValue('');
    setActiveFilters(new Set());
    setPendingFilters(new Set());
    // Force SWR revalidation to return to initial data
    if (mutate) {
      mutate();
    }
  }, [mutate]);

  // Fonction pour effectuer la recherche
  const performSearch = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.warning('Please enter a search term');
      return;
    }
    setSearchQuery(trimmed);
    // Force SWR revalidation for new data
    if (mutate) {
      mutate();
    }
  }, [inputValue, mutate]);

  // Function to handle Enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  }, [performSearch]);


  // Fonction pour partager la recherche actuelle
  const shareCurrentSearch = useCallback(async () => {
    try {
      const url = new URL(window.location.href);
      url.search = ''; // Clear existing params
      
      // Add search query if present
      if (searchQuery.trim()) {
        url.searchParams.set('q', searchQuery.trim());
      }
      
      // Add active filters
      if (activeFilters.has('hvci')) url.searchParams.set('hvci', 'true');
      if (activeFilters.has('killer')) url.searchParams.set('killer', 'true');
      if (activeFilters.has('trusted-cert')) url.searchParams.set('trusted-cert', 'true');
      if (activeFilters.has('untrusted-cert')) url.searchParams.set('untrusted-cert', 'true');
      if (activeFilters.has('recent')) url.searchParams.set('recent', 'true');
      if (activeFilters.has('newest-first')) url.searchParams.set('newest-first', 'true');
      if (activeFilters.has('oldest-first')) url.searchParams.set('oldest-first', 'true');
      
      // Certificate validation filters
      if (activeFilters.has('cert-revoked')) url.searchParams.set('cert-revoked', 'true');
      if (activeFilters.has('cert-expired')) url.searchParams.set('cert-expired', 'true');
      if (activeFilters.has('cert-suspicious')) url.searchParams.set('cert-suspicious', 'true');
      if (activeFilters.has('cert-valid')) url.searchParams.set('cert-valid', 'true');
      if (activeFilters.has('cert-missing')) url.searchParams.set('cert-missing', 'true');
      
      // Behavioral filters
      if (activeFilters.has('memory-manipulator')) url.searchParams.set('memory-manipulator', 'true');
      if (activeFilters.has('process-killer')) url.searchParams.set('process-killer', 'true');
      if (activeFilters.has('debug-bypass')) url.searchParams.set('debug-bypass', 'true');
      if (activeFilters.has('registry-manipulator')) url.searchParams.set('registry-manipulator', 'true');
      if (activeFilters.has('file-manipulator')) url.searchParams.set('file-manipulator', 'true');
      
      // Architecture filters
      if (activeFilters.has('architecture-AMD64')) url.searchParams.set('architecture', 'AMD64');
      if (activeFilters.has('architecture-I386')) url.searchParams.set('architecture', 'I386');
      if (activeFilters.has('architecture-ARM64')) url.searchParams.set('architecture', 'ARM64');
      
      // Add current page if not page 1
      if (currentPage > 1) {
        url.searchParams.set('page', currentPage.toString());
      }
      
      const shareUrl = url.toString();
      
      // Update current URL without page reload
      window.history.replaceState({}, '', shareUrl);
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        console.warn('Clipboard API failed:', error);
        toast.error('Failed to copy link - please copy manually');
      }
    } catch (error) {
      console.error('Failed to create share URL:', error);
      toast.error('Failed to create share link');
    }
  }, [searchQuery, activeFilters, currentPage]);

  // Apply URL parameters only during navigation changes (popstate)
  useEffect(() => {
    // Function to handle URL changes (browser back/forward buttons)
    const handlePopState = () => {
      const urlParams = getInitialUrlParams();
      
      // Appliquer la recherche
      setSearchQuery(urlParams.searchQuery);
      setInputValue(urlParams.searchQuery);
      
      // Appliquer les filtres
      setActiveFilters(urlParams.activeFilters);
      setPendingFilters(urlParams.activeFilters);
      
      // Appliquer la page
      setCurrentPage(urlParams.currentPage);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Update URL when filters/search change (except on first render)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Skip URL update on first render to avoid double loading
    if (isFirstRender.current) {
      return;
    }
    
    const url = new URL(window.location.href);
    url.search = ''; // Clear existing params
    
    // Add search query if present
    if (searchQuery.trim()) {
      url.searchParams.set('q', searchQuery.trim());
    }
    
    // Add active filters
    if (activeFilters.has('hvci')) url.searchParams.set('hvci', 'true');
    if (activeFilters.has('killer')) url.searchParams.set('killer', 'true');
    if (activeFilters.has('trusted-cert')) url.searchParams.set('trusted-cert', 'true');
    if (activeFilters.has('untrusted-cert')) url.searchParams.set('untrusted-cert', 'true');
    if (activeFilters.has('recent')) url.searchParams.set('recent', 'true');
    if (activeFilters.has('newest-first')) url.searchParams.set('newest-first', 'true');
    if (activeFilters.has('oldest-first')) url.searchParams.set('oldest-first', 'true');
    
    // Certificate validation filters
    if (activeFilters.has('cert-revoked')) url.searchParams.set('cert-revoked', 'true');
    if (activeFilters.has('cert-expired')) url.searchParams.set('cert-expired', 'true');
    if (activeFilters.has('cert-suspicious')) url.searchParams.set('cert-suspicious', 'true');
    if (activeFilters.has('cert-valid')) url.searchParams.set('cert-valid', 'true');
    if (activeFilters.has('cert-missing')) url.searchParams.set('cert-missing', 'true');
    
    // Behavioral filters
    if (activeFilters.has('memory-manipulator')) url.searchParams.set('memory-manipulator', 'true');
    if (activeFilters.has('process-killer')) url.searchParams.set('process-killer', 'true');
    if (activeFilters.has('debug-bypass')) url.searchParams.set('debug-bypass', 'true');
    if (activeFilters.has('registry-manipulator')) url.searchParams.set('registry-manipulator', 'true');
    if (activeFilters.has('file-manipulator')) url.searchParams.set('file-manipulator', 'true');
    
    // Architecture filters
    if (activeFilters.has('architecture-AMD64')) url.searchParams.set('architecture', 'AMD64');
    if (activeFilters.has('architecture-I386')) url.searchParams.set('architecture', 'I386');
    if (activeFilters.has('architecture-ARM64')) url.searchParams.set('architecture', 'ARM64');
    
    // Add current page if not page 1
    if (currentPage > 1) {
      url.searchParams.set('page', currentPage.toString());
    }
    
    // Update URL without page reload
    const newUrl = url.toString();
    if (newUrl !== window.location.href) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchQuery, activeFilters, currentPage]);

  // Gestion du bouton Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Fonctions de pagination
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll vers le haut de la liste
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [totalPages, goToPage]);

  // Gestion des sections collapsibles
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });
  }, []);

  // Hash row for copy-to-clipboard
  const HashRow = ({ type, value, onCopy }: { type: string; value: string; onCopy: () => void }) => (
    <button
      type="button"
      onClick={onCopy}
      className="hash-row flex items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60 transition-colors duration-smooth ease-apple w-full"
      title={`Click to copy ${type}`}
    >
      <span className="font-medium text-muted-foreground shrink-0 pt-0.5">{type}</span>
      <span className="font-mono text-xs break-all text-foreground min-w-0 flex-1">{value}</span>
    </button>
  );

  // Gestion des sections collapsibles
  const renderHashTags = (hashes: { MD5?: string; SHA1?: string; SHA256?: string }, authentihash?: { MD5?: string; SHA1?: string; SHA256?: string }, index?: number) => {
    const copyToClipboard = async (hashType: string, hashValue: string) => {
      try {
        await navigator.clipboard.writeText(hashValue);
        toast.success(`${hashType} hash copied to clipboard!`);
      } catch (err) {
        console.error('Failed to copy: ', err);
        toast.error(`Failed to copy ${hashType} hash`);
      }
    };

    const hasStandardHashes = hashes.MD5 || hashes.SHA1 || hashes.SHA256;
    const hasAuthentihashes = authentihash?.MD5 || authentihash?.SHA1 || authentihash?.SHA256;
    
    const authentihashSectionId = `authentihash-${index || 0}`;
    const isAuthentihashExpanded = expandedSections.has(authentihashSectionId);

    if (!hasStandardHashes && !hasAuthentihashes) {
      return (
        <div className="card-section">
          <div className="card-section-header">
            <i className="fas fa-fingerprint" aria-hidden />
            <span className="card-section-title">File Hashes</span>
          </div>
          <p className="text-sm text-muted-foreground">No hashes available</p>
        </div>
      );
    }

    return (
      <div className="card-section">
        <div className="card-section-header">
          <i className="fas fa-fingerprint" aria-hidden />
          <span className="card-section-title">File Hashes</span>
        </div>
        <div className="space-y-2">
          {hashes.MD5 && (
            <HashRow type="MD5" value={hashes.MD5} onCopy={() => copyToClipboard('MD5', hashes.MD5!)} />
          )}
          {hashes.SHA1 && (
            <HashRow type="SHA1" value={hashes.SHA1} onCopy={() => copyToClipboard('SHA1', hashes.SHA1!)} />
          )}
          {hashes.SHA256 && (
            <HashRow type="SHA256" value={hashes.SHA256} onCopy={() => copyToClipboard('SHA256', hashes.SHA256!)} />
          )}
          {hasAuthentihashes && (
            <Collapsible open={isAuthentihashExpanded} onOpenChange={() => toggleSection(authentihashSectionId)}>
              <div className="flex w-full items-center justify-between gap-2">
                <CollapsibleTrigger className="collapsible-trigger group flex flex-1 items-center justify-between gap-2 text-left text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    Authentihashes
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-smooth ease-apple group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={openAuthentihashHelp}
                  title="Learn about Authentihashes"
                  aria-label="Authentihash help"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
              <CollapsibleContent>
                <div className="collapsible-content-block space-y-2">
                  {authentihash?.MD5 && <HashRow type="MD5" value={authentihash.MD5} onCopy={() => copyToClipboard('Authentihash MD5', authentihash!.MD5!)} />}
                {authentihash?.SHA1 && <HashRow type="SHA1" value={authentihash.SHA1} onCopy={() => copyToClipboard('Authentihash SHA1', authentihash!.SHA1!)} />}
                  {authentihash?.SHA256 && <HashRow type="SHA256" value={authentihash.SHA256} onCopy={() => copyToClipboard('Authentihash SHA256', authentihash!.SHA256!)} />}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    );
  };

  // Generate status tags
  const generateStatusTags = (driver: Driver) => {
    const tags = [];
    
    if (driver.LoadsDespiteHVCI) {
      const isTrue = driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE';
      tags.push({
        text: isTrue ? 'MVDB PASSED' : 'MVDB BLOCKED',
        type: isTrue ? 'success' : 'danger',
        icon: isTrue ? 'fas fa-check-circle' : 'fas fa-times-circle'
      });
    }
    
    // Process killer tag (keep in status tags for now as requested)
    if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
      const functions = driver.ImportedFunctions.map(f => f.toLowerCase());
      
      // Process killer detection
      const hasProcessKiller = functions.some(func => 
        func.includes('zwterminateprocess')
      );
      if (hasProcessKiller) {
        tags.push({
          text: 'PROCESS KILLER',
          type: 'process-killer',
          icon: 'fas fa-skull-crossbones'
        });
      }
    }
    
    // Certificate handling with priority
    if (hasTrustedCertificate(driver)) {
      tags.push({
        text: 'TRUSTED CERTIFICATE',
        type: 'success',
        icon: 'fas fa-certificate'
      });
    } else if (hasUntrustedCertificate(driver)) {
      tags.push({
        text: 'UNKNOWN CERTIFICATE',
        type: 'warning',
        icon: 'fas fa-exclamation-triangle'
      });
    } else if (hasActiveCertificate(driver)) {
      // Active but unclassified certificate (backup)
      tags.push({
        text: 'ALIVE CERTIFICATE',
        type: 'info',
        icon: 'fas fa-certificate'
      });
    }
    
    return tags;
  };

  // Generate capacity tags (behavioral analysis)
  const generateCapacityTags = (driver: Driver) => {
    const capacities = [];
    
    if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
      const functions = driver.ImportedFunctions.map(f => f.toLowerCase());
      
      // Process killer detection
      const hasProcessKiller = functions.some(func => 
        func.includes('zwterminateprocess')
      );
      if (hasProcessKiller) {
        capacities.push({
          text: 'Process Killer',
          type: 'process-killer',
          icon: 'fas fa-skull-crossbones'
        });
      }
      
      // Memory manipulator detection
      const hasMemoryManipulator = functions.some(func => 
        func.includes('zwmap') || func.includes('zwallocate') ||
        func.includes('mmmap') || func.includes('mmallocate') ||
        func.includes('virtualalloc') || func.includes('virtualprotect') ||
        func.includes('heap') || func.includes('pool')
      );
      if (hasMemoryManipulator) {
        capacities.push({
          text: 'Memory Manipulator',
          type: 'memory-manipulator',
          icon: 'fas fa-memory'
        });
      }
      
      // Debug bypass detection
      const hasDebugBypass = functions.some(func => 
        func.includes('zwsetinformationprocess') || func.includes('zwsetinformationthread') ||
        func.includes('zwquerysysteminformation') || func.includes('dbgkd') ||
        func.includes('kddebugger') || func.includes('debugport')
      );
      if (hasDebugBypass) {
        capacities.push({
          text: 'Debug Bypass',
          type: 'debug-bypass',
          icon: 'fas fa-bug'
        });
      }
      
      // Registry manipulator detection
      const hasRegistryManipulator = functions.some(func => 
        func.includes('zwcreatekey') || func.includes('zwopenkey') ||
        func.includes('zwsetvaluekey') || func.includes('zwdeletekey') ||
        func.includes('regcreate') || func.includes('regopen') ||
        func.includes('regset') || func.includes('regdelete')
      );
      if (hasRegistryManipulator) {
        capacities.push({
          text: 'Registry Manipulator',
          type: 'registry-manipulator',
          icon: 'fas fa-edit'
        });
      }
      
      // File manipulator detection
      const hasFileManipulator = functions.some(func => 
        func.includes('zwcreatefile') || func.includes('zwopenfile') ||
        func.includes('zwreadfile') || func.includes('zwwritefile') ||
        func.includes('zwdeletefile') || func.includes('iocreate') ||
        func.includes('ntread') || func.includes('ntwrite')
      );
      if (hasFileManipulator) {
        capacities.push({
          text: 'File Manipulator',
          type: 'file-manipulator',
          icon: 'fas fa-file-alt'
        });
      }
    }
    
    return capacities;
  };

  // Generate certificate tags based on KnownVulnerableSamples CertificateStatus
  const generateCertificateTags = (driver: Driver) => {
    const certTags = [];
    
    if (driver.KnownVulnerableSamples && Array.isArray(driver.KnownVulnerableSamples)) {
      // Check for certificate status across all samples
      let hasRevoked = false;
      let hasExpired = false;
      let hasInvalid = false;
      let hasValid = false;
      let hasUnknown = false;
      
      for (const sample of driver.KnownVulnerableSamples) {
        if (sample && typeof sample === 'object' && sample.CertificateStatus) {
          const status = sample.CertificateStatus;
          if (status === 'Revoked') hasRevoked = true;
          if (status === 'Expired') hasExpired = true;
          if (status === 'Invalid') hasInvalid = true;
          if (status === 'Valid') hasValid = true;
          if (status === 'Unknown') hasUnknown = true;
        }
      }
      
      // Add tags based on certificate status (prioritize most critical first)
      if (hasRevoked) {
        certTags.push({
          text: 'REVOKED CERTIFICATE',
          type: 'danger',
          icon: 'fas fa-ban'
        });
      }
      
      if (hasExpired) {
        certTags.push({
          text: 'EXPIRED CERTIFICATE',
          type: 'warning',
          icon: 'fas fa-clock'
        });
      }
      
      if (hasInvalid) {
        certTags.push({
          text: 'INVALID CERTIFICATE',
          type: 'warning',
          icon: 'fas fa-exclamation-triangle'
        });
      }
      
      if (hasValid && !hasRevoked && !hasExpired && !hasInvalid) {
        certTags.push({
          text: 'VALID CERTIFICATE',
          type: 'success',
          icon: 'fas fa-check-circle'
        });
      }
      
      if (hasUnknown && !hasValid && !hasRevoked && !hasExpired && !hasInvalid) {
        certTags.push({
          text: 'CERTIFICATE STATUS UNKNOWN',
          type: 'secondary',
          icon: 'fas fa-question-circle'
        });
      }
    }
    
    return certTags;
  };

  // Fixed capacity types in display order so every card shows the same pills (consistent like left panels)
  const CAPACITY_ORDER: Array<{ key: string; text: string; type: string }> = [
    { key: 'process-killer', text: 'Process Killer', type: 'process-killer' },
    { key: 'memory-manipulator', text: 'Memory Manipulator', type: 'memory-manipulator' },
    { key: 'debug-bypass', text: 'Debug Bypass', type: 'debug-bypass' },
    { key: 'registry-manipulator', text: 'Registry Manipulator', type: 'registry-manipulator' },
    { key: 'file-manipulator', text: 'File Manipulator', type: 'file-manipulator' },
  ];

  // Render capacities section: always show same four pills; present = outline, absent = muted (layout consistent like left)
  const renderCapacitiesSection = (capacities: Array<{ text: string; type: string; icon?: string }>) => {
    const byType = new Map(capacities.map(c => [c.type, c]));
    return (
      <div className="card-section">
        <div className="card-section-header">
          <i className="fas fa-cogs" aria-hidden />
          <span className="card-section-title">Capacities</span>
        </div>
        <div className="grid grid-cols-2 gap-2 min-h-[4.25rem]">
          {CAPACITY_ORDER.map(({ key, text, type }) => {
            const present = byType.has(type);
            return (
              <Badge
                key={key}
                variant={present ? 'outline' : 'secondary'}
                className={`text-xs ${present ? '' : 'opacity-50'}`}
              >
                {text}
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStatusTags = (tags: Array<{ text: string; type: string; icon?: string }>) => {
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
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant={variant(tag)} className="text-xs">
            {tag.text}
          </Badge>
        ))}
      </div>
    );
  };

  // Section simple (non-collapsible)
  const renderSimpleSection = (title: string, content: string, icon: string) => {
    if (!content ||
        content.toLowerCase() === 'unknown' ||
        content.toLowerCase() === 'no description available') return null;

    return (
      <div className="card-section">
        <div className="card-section-header">
          <i className={icon} aria-hidden />
          <span className="card-section-title">{title}</span>
        </div>
        <p className="card-section-content text-sm text-muted-foreground leading-relaxed">
          {content}
        </p>
      </div>
    );
  };

  // Helper function to copy function name to clipboard
  const copyFunctionToClipboard = async (functionName: string) => {
    try {
      await navigator.clipboard.writeText(functionName);
      toast.success(`Function "${functionName}" copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy function:', err);
      toast.error('Failed to copy function to clipboard');
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
    
    // Function classification by categories
    const categorizedFunctions = {
      critical: [] as string[],
      process: [] as string[],
      memory: [] as string[],
      file: [] as string[],
      registry: [] as string[],
      network: [] as string[],
      security: [] as string[],
      kernel: [] as string[],
      other: [] as string[]
    };

    // Group functions by category
    functions.forEach(func => {
      const funcLower = func.toLowerCase();
      
      // Fonctions critiques/dangereuses
      if (funcLower.includes('zwterminateprocess')) {
        categorizedFunctions.critical.push(func);
      }
      // Gestion des processus
      else if (funcLower.includes('process') || 
               funcLower.includes('thread') ||
               funcLower.includes('zwcreate') ||
               funcLower.includes('zwopen') ||
               funcLower.includes('pscreate') ||
               funcLower.includes('psget')) {
        categorizedFunctions.process.push(func);
      }
      // Memory management
      else if (funcLower.includes('memory') || 
               funcLower.includes('virtual') ||
               funcLower.includes('mmmap') ||
               funcLower.includes('mmallocate') ||
               funcLower.includes('zwmap') ||
               funcLower.includes('zwallocate') ||
               funcLower.includes('heap') ||
               funcLower.includes('pool')) {
        categorizedFunctions.memory.push(func);
      }
      // File system
      else if (funcLower.includes('file') || 
               funcLower.includes('directory') ||
               funcLower.includes('zwread') ||
               funcLower.includes('zwwrite') ||
               funcLower.includes('zwdelete') ||
               funcLower.includes('iocreate') ||
               funcLower.includes('ntread') ||
               funcLower.includes('ntwrite')) {
        categorizedFunctions.file.push(func);
      }
      // Registre
      else if (funcLower.includes('registry') || 
               funcLower.includes('regopen') ||
               funcLower.includes('regcreate') ||
               funcLower.includes('regset') ||
               funcLower.includes('regquery') ||
               funcLower.includes('zwopen') && funcLower.includes('key') ||
               funcLower.includes('zwcreate') && funcLower.includes('key')) {
        categorizedFunctions.registry.push(func);
      }
      // Network
      else if (funcLower.includes('socket') || 
               funcLower.includes('wsk') ||
               funcLower.includes('network') ||
               funcLower.includes('tcp') ||
               funcLower.includes('udp') ||
               funcLower.includes('tdi')) {
        categorizedFunctions.network.push(func);
      }
      // Security
      else if (funcLower.includes('security') || 
               funcLower.includes('token') ||
               funcLower.includes('privilege') ||
               funcLower.includes('seaccess') ||
               funcLower.includes('seaudit') ||
               funcLower.includes('sesingle') ||
               funcLower.includes('zwsetinformation') && funcLower.includes('token')) {
        categorizedFunctions.security.push(func);
      }
      // Kernel/system functions
      else if (funcLower.includes('ke') ||
               funcLower.includes('hal') ||
               funcLower.includes('io') ||
               funcLower.includes('ob') ||
               funcLower.includes('ex') ||
               funcLower.includes('rtl') ||
               funcLower.includes('zwquery') ||
               funcLower.includes('zwset') ||
               funcLower.includes('ntquery') ||
               funcLower.includes('ntset')) {
        categorizedFunctions.kernel.push(func);
      }
      // Autres
      else {
        categorizedFunctions.other.push(func);
      }
    });
    
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
              {(() => {
                const renderFuncCategory = (
                  categoryKey: string,
                  label: string,
                  Icon: React.ComponentType<{ className?: string }>,
                  funcs: string[],
                  danger?: boolean
                ) =>
                  funcs.length > 0 ? (
                    <Collapsible
                      key={categoryKey}
                      open={expandedSections.has(categoryKey)}
                      onOpenChange={() => toggleSection(categoryKey)}
                    >
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
                              <button
                                type="button"
                                onClick={() => copyFunctionToClipboard(func)}
                                title={`Copy ${func}`}
                                className={`func-row flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs font-mono transition-colors duration-smooth ease-apple hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${danger ? 'text-destructive' : 'text-foreground'}`}
                              >
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
                  <>
                    {renderFuncCategory(`critical-${index}`, 'Critical', AlertTriangle, categorizedFunctions.critical, true)}
                    {renderFuncCategory(`process-${index}`, 'Process', Cpu, categorizedFunctions.process)}
                    {renderFuncCategory(`memory-${index}`, 'Memory', MemoryStick, categorizedFunctions.memory)}
                    {renderFuncCategory(`file-${index}`, 'File system', FileCode, categorizedFunctions.file)}
                    {renderFuncCategory(`registry-${index}`, 'Registry', Database, categorizedFunctions.registry)}
                    {renderFuncCategory(`network-${index}`, 'Network', Network, categorizedFunctions.network)}
                    {renderFuncCategory(`security-${index}`, 'Security', Shield, categorizedFunctions.security)}
                    {renderFuncCategory(`kernel-${index}`, 'Kernel/System', Settings, categorizedFunctions.kernel)}
                    {renderFuncCategory(`other-${index}`, 'Other', MoreHorizontal, categorizedFunctions.other)}
                  </>
                );
              })()}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Section des ressources
  const renderResourcesSection = (resources: string[] | undefined, driver: Driver, index: number) => {
    if (!resources || resources.length === 0) return null;
    
    // Filtrer les liens "internal research"
    const filteredResources = resources.filter(resource => {
      if (!resource || !resource.trim()) return false;
      const lowerResource = resource.toLowerCase();
      return !lowerResource.includes('internal research') && 
             !lowerResource.includes('internal-research') &&
             !lowerResource.includes('internal_research');
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
              {filteredResources.map((resource, resourceIndex) => {
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
                  ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`
                  : null;
                return (
                  <a
                    key={`resource-${resourceIndex}`}
                    href={resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-link flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors duration-smooth ease-apple"
                    title={resource}
                  >
                    {faviconUrl ? (
                      <Image src={faviconUrl} alt="" width={14} height={14} className="shrink-0" />
                    ) : (
                      <i className="fas fa-external-link-alt text-muted-foreground shrink-0" aria-hidden />
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



  // Section des commandes
  const renderCommandsSection = (commands: Driver['Commands'], driver: Driver, index: number) => {
    if (!commands || typeof commands !== 'object') return null;

    const sectionId = `commands-${index}`;
    const isExpanded = expandedSections.has(sectionId);

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => toast.success('Command copied to clipboard!')).catch(() => toast.error('Failed to copy command'));
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
                        <i className="fas fa-copy text-muted-foreground" aria-hidden />
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

  // Helper function to get the most detailed description
  const getBestDescription = (driver: Driver): string => {
    const driverDesc = driver.Description || '';
    const commandDesc = driver.Commands?.Description || '';
    
    // If we don't have both descriptions, return the one we have
    if (!driverDesc && !commandDesc) return 'No description available';
    if (!driverDesc) return commandDesc;
    if (!commandDesc) return driverDesc;
    
    // If both exist, choose the longer/more detailed one
    // Also prioritize command description if it's significantly more detailed
    if (commandDesc.length > driverDesc.length * 1.2) {
      return commandDesc;
    }
    
    // Default to driver description if lengths are similar
    return driverDesc;
  };

  // Function to download a driver
  const downloadDriver = useCallback((driver: Driver) => {
    const hash = driver.MD5;
    const filename = getDriverName(driver);
    
    if (!hash) {
      toast.error('No MD5 hash available for download');
      return;
    }
    
    // Create download URL based on MD5 hash
    const downloadUrl = `https://github.com/magicsword-io/LOLDrivers/raw/main/drivers/${hash}.bin`;
    
    // Create temporary link to trigger download
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

  // Helper function to format architecture display
  const formatArchitecture = (machineType: string | undefined): string | null => {
    if (!machineType) return null;
    
    switch (machineType.toUpperCase()) {
      case 'AMD64':
        return 'x64';
      case 'I386':
        return 'x32';
      case 'ARM64':
        return 'ARM64';
      default:
        return machineType.toLowerCase();
    }
  };

  // Helper function to get the best available driver name
  const getDriverName = (driver: Driver): string => {
    // First try OriginalFilename, then Filename
    if (driver.OriginalFilename && driver.OriginalFilename.toLowerCase() !== 'unknown') {
      return driver.OriginalFilename;
    }
    if (driver.Filename && driver.Filename.toLowerCase() !== 'unknown') {
      return driver.Filename;
    }
    
    // If both are empty or unknown, try to get from Tags array
    if (driver.Tags && Array.isArray(driver.Tags) && driver.Tags.length > 0) {
      const firstTag = driver.Tags[0];
      if (firstTag && firstTag.trim()) {
        return firstTag;
      }
    }
    
    // Fallback to Unknown Driver
    return 'Unknown Driver';
  };

  // Check if driver is process killer (for card accent)
  const isProcessKiller = (d: Driver) =>
    d.ImportedFunctions?.some((f) => f.toLowerCase().includes('zwterminateprocess')) ?? false;

  // Create driver card
  const createDriverCard = (driver: Driver, index: number) => {
    const hashes = {
      MD5: driver.MD5,
      SHA1: driver.SHA1,
      SHA256: driver.SHA256
    };
    const statusTags = generateStatusTags(driver);
    const capacityTags = generateCapacityTags(driver);
    const certificateTags = generateCertificateTags(driver);
    const filename = getDriverName(driver);
    const formattedArch = formatArchitecture(driver.MachineType as string);
    const danger = isProcessKiller(driver);

    return (
      <Card
        key={`driver-${index}-${driver.MD5 || driver.SHA256}`}
        className={`driver-card flex h-full flex-col overflow-hidden transition-shadow duration-smooth ease-apple hover:shadow-md ${danger ? 'driver-card--danger border-l-4 border-l-destructive' : ''}`}
      >
        <CardHeader className="driver-card-header shrink-0 pb-3">
          <div className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="driver-card-icon shrink-0 rounded-md bg-muted p-1.5">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </span>
                <span className="flex items-baseline gap-2 flex-wrap min-w-0">
                  <h3 className="text-base font-semibold leading-tight tracking-tight">
                    {filename}
                  </h3>
                  {formattedArch && (
                    <Badge variant="secondary" className="font-normal text-xs shrink-0">{formattedArch}</Badge>
                  )}
                </span>
              </div>
              {(driver.Company || driver.Created) && (
                <p className="text-xs text-muted-foreground pl-9">
                  {[driver.Company, driver.Created].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-9 w-9"
              onClick={() => downloadDriver(driver)}
              title={`Download ${filename}`}
              aria-label={`Download ${filename}`}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {renderStatusTags(statusTags)}
            {certificateTags.length > 0 && renderStatusTags(certificateTags)}
          </div>
        </CardHeader>
        <CardContent className="driver-card-body flex flex-1 flex-col min-h-0 pt-0 space-y-0">
          {renderHashTags(hashes, driver.Authentihash, index)}

          {renderSimpleSection('Description', getBestDescription(driver), 'fas fa-info-circle')}
          {driver.Category && renderSimpleSection('Category', driver.Category, 'fas fa-tags')}
          {driver.Author && renderSimpleSection('Author', driver.Author, 'fas fa-user')}
          {driver.Created && renderSimpleSection('Created Date', driver.Created, 'fas fa-calendar')}
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
              <SafeDate 
                date={statsData?.stats?.lastUpdated || null}
                prefix="Last updated: "
                fallback="Loading..."
              />
            </p>
          </div>
          <div className="header-controls flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChangelogPopup(true)}
              title="View changelog and recent updates"
              aria-label="View changelog and recent updates"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={shareCurrentSearch}
              title="Share current search and filters"
              aria-label="Share current search and filters"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelpPopup(true)}
              aria-label="Help - Technical Definitions"
              title="Help - Technical Definitions"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stats-section">
          <div className="stat-item flex flex-col gap-0.5">
            <span className="stat-label flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 opacity-70" /> Total Drivers
            </span>
            <span className="stat-value">{statsData?.stats?.total || 0}</span>
          </div>
          <div 
            role="button"
            tabIndex={0}
            className={`stat-item clickable flex flex-col gap-0.5 ${activeFilters.has('hvci') ? 'active' : ''}`}
            onClick={() => applyDirectFilter('hvci')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), applyDirectFilter('hvci'))}
          >
            <span className="stat-label flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 opacity-70" /> MVDB Passed
            </span>
            <span className="stat-value">{statsData?.stats?.hvciCompatible || 0}</span>
          </div>
          <div 
            role="button"
            tabIndex={0}
            className={`stat-item clickable process-killer-item flex flex-col gap-0.5 ${activeFilters.has('process-killer') ? 'active' : ''}`}
            onClick={() => applyDirectFilter('process-killer')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), applyDirectFilter('process-killer'))}
          >
            <span className="stat-label flex items-center gap-1.5">
              <Skull className="h-3.5 w-3.5 opacity-70" /> Process Killer Drivers
            </span>
            <span className="stat-value">{statsData?.stats?.processKillerDrivers || 0}</span>
          </div>
        </div>
        
        {/* Microsoft Vulnerable Drivers Blocklist information */}
        <HVCIBlocklistInfo stats={statsData?.stats} />
      </header>

      <div className="search-section">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              id="driver-search"
              name="search"
              type="text"
              placeholder="Search drivers by name, hash, company, description..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              disabled={isLoading}
              className="h-10"
              aria-label="Search drivers by name, hash, company, or description"
            />
          </div>
          <Button
            onClick={performSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
          <Button
            variant="outline"
            onClick={clearAllFilters}
            disabled={!searchQuery.trim() && activeFilters.size === 0}
          >
            <Eraser className="h-4 w-4" />
            Clear
          </Button>
        </div>
        
        <div className="filter-options">
          <div className="filter-group">
            <span className="filter-label">Quick Filters:</span>
            <Button
              variant={pendingFilters.has('hvci') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('hvci')}
            >
              <Check className="h-3.5 w-3.5" />
              MVDB Passed
            </Button>
            <Button
              variant={pendingFilters.has('trusted-cert') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('trusted-cert')}
              disabled={pendingFilters.has('untrusted-cert')}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Trusted Certificate
            </Button>
            <Button
              variant={pendingFilters.has('untrusted-cert') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('untrusted-cert')}
              disabled={pendingFilters.has('trusted-cert')}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Unknown Certificate
            </Button>
            <Button
              variant={pendingFilters.has('recent') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('recent')}
            >
              <Clock className="h-3.5 w-3.5" />
              Recent Drivers
            </Button>
            <Button
              variant={pendingFilters.has('newest-first') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('newest-first')}
              disabled={pendingFilters.has('oldest-first')}
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Newest First
            </Button>
            <Button
              variant={pendingFilters.has('oldest-first') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('oldest-first')}
              disabled={pendingFilters.has('newest-first')}
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Oldest First
            </Button>
          </div>
          <div className="filter-group advanced-filters">
            <span className="filter-label">Behaviors:</span>
            <Button
              variant={pendingFilters.has('process-killer') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('process-killer')}
            >
              <Skull className="h-3.5 w-3.5" />
              Process Killer
            </Button>
            <Button
              variant={pendingFilters.has('memory-manipulator') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('memory-manipulator')}
            >
              <MemoryStick className="h-3.5 w-3.5" />
              Memory Manipulator
            </Button>
            <Button
              variant={pendingFilters.has('debug-bypass') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('debug-bypass')}
            >
              <Bug className="h-3.5 w-3.5" />
              Debug Bypass
            </Button>
            <Button
              variant={pendingFilters.has('registry-manipulator') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('registry-manipulator')}
            >
              <Database className="h-3.5 w-3.5" />
              Registry Manipulator
            </Button>
            <Button
              variant={pendingFilters.has('file-manipulator') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('file-manipulator')}
            >
              <FileCode className="h-3.5 w-3.5" />
              File Manipulator
            </Button>
          </div>
          
          {/* Certificate filters temporarily disabled
          <div className="filter-group certificate-filters">
            <span className="filter-label"><i className="fas fa-certificate"></i> Certificates:</span>
            <button 
              className={`filter-btn cert-filter cert-expired-filter ${pendingFilters.has('cert-expired') ? 'active' : ''} ${pendingFilters.has('cert-missing') ? 'disabled' : ''}`}
              onClick={() => toggleFilter('cert-expired')}
              disabled={pendingFilters.has('cert-missing')}
            >
              <i className="fas fa-clock"></i> Expired
            </button>
            <button 
              className={`filter-btn cert-filter cert-valid-filter ${pendingFilters.has('cert-valid') ? 'active' : ''} ${(pendingFilters.has('cert-missing') || pendingFilters.has('cert-expired')) ? 'disabled' : ''}`}
              onClick={() => toggleFilter('cert-valid')}
              disabled={pendingFilters.has('cert-missing') || pendingFilters.has('cert-expired')}
            >
              <i className="fas fa-check-circle"></i> Valid
            </button>
            <button 
              className={`filter-btn cert-filter cert-missing-filter ${pendingFilters.has('cert-missing') ? 'active' : ''} ${(pendingFilters.has('cert-valid') || pendingFilters.has('cert-expired')) ? 'disabled' : ''}`}
              onClick={() => toggleFilter('cert-missing')}
              disabled={pendingFilters.has('cert-valid') || pendingFilters.has('cert-expired')}
            >
              <i className="fas fa-question-circle"></i> No Cert
            </button>
          </div>
          */}
          
          <div className="filter-group meta-filters">
            <span className="filter-label">Architecture:</span>
            <Button
              variant={pendingFilters.has('architecture-AMD64') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('architecture-AMD64')}
            >
              <Cpu className="h-3.5 w-3.5" />
              x64
            </Button>
            <Button
              variant={pendingFilters.has('architecture-I386') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('architecture-I386')}
            >
              <Cpu className="h-3.5 w-3.5" />
              x32
            </Button>
            <Button
              variant={pendingFilters.has('architecture-ARM64') ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleFilter('architecture-ARM64')}
            >
              <Cpu className="h-3.5 w-3.5" />
              arm64
            </Button>
          </div>
          <div className="filter-group control-filters">
            <Button
              onClick={applyFilters}
              disabled={pendingFilters.size === 0 && searchQuery.trim() === ''}
              size="sm"
            >
              <Check className="h-3.5 w-3.5" />
              Apply Filters
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllFilters}
              disabled={!searchQuery.trim() && activeFilters.size === 0}
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterHelpPopup(true)}
              title="How filters work"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Filter Help
            </Button>
          </div>
        </div>
        <p className="filter-apply-hint text-xs text-muted-foreground mt-1.5" id="filter-apply-hint">
          Changes apply when you click Apply Filters.
        </p>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {filterAnnouncement}
        </div>
        
        {/* Barre de chargement */}
        {isLoading && (
          <div className="loading-bar-container">
            <div className="loading-bar">
              <div className="loading-bar-progress"></div>
            </div>
            <span className="loading-bar-text">Searching drivers...</span>
          </div>
        )}
        
        {/* Affichage d'erreur */}
        {error && (
          <div className="error-bar-container">
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              <span>Search failed. Please try again.</span>
              <button 
                className="retry-button"
                onClick={() => mutate()}
                title="Retry search"
              >
                <i className="fas fa-redo"></i>
              </button>
            </div>
          </div>
        )}
        
        <div className="search-stats mb-4">
          <span>
            {isLoading 
              ? 'Searching...' 
              : `Showing ${Math.min(ITEMS_PER_PAGE, paginatedDrivers.length)} of ${totalItems} drivers (Page ${currentPage} of ${totalPages})`
            }
          </span>
          {searchKey && <span className="server-search-indicator"> (Server-side search)</span>}
          {error && <span className="error-indicator"> (Error occurred)</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 drivers-grid items-stretch">        
        {!isLoading && paginatedDrivers.length > 0 ? (
          paginatedDrivers.map((driver, index) => {
            // Calculate global index for uniqueness
            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
            return createDriverCard(driver, globalIndex);
          })
        ) : !isLoading ? (
          <div className="empty-state">
            <h3>No drivers found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination">
            <button 
              className="pagination-btn" 
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              aria-label="Go to first page"
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
            <button 
              className="pagination-btn" 
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <i className="fas fa-angle-left"></i>
            </button>
            
            <div className="pagination-numbers">
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                // Ajuster startPage si on est proche de la fin
                if (endPage - startPage < maxVisiblePages - 1) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      className={`pagination-number ${i === currentPage ? 'active' : ''}`}
                      onClick={() => goToPage(i)}
                      aria-label={`Go to page ${i}`}
                    >
                      {i}
                    </button>
                  );
                }
                
                return pages;
              })()}
            </div>
            
            <button 
              className="pagination-btn" 
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <i className="fas fa-angle-right"></i>
            </button>
            <button 
              className="pagination-btn" 
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
          
          {/* Pagination Indicator */}
          <div className="pagination-indicator">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 back-to-top-enter"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <span className="sr-only">Back to top</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </Button>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__grid">
            <section className="footer__block" aria-labelledby="footer-thanks">
              <h2 id="footer-thanks" className="footer__heading">
                <Heart className="footer__icon" aria-hidden />
                Special Thanks
              </h2>
              <p className="footer__text">
                This database is based on the amazing work from the{' '}
                <a
                  href="https://loldrivers.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  LOLDrivers.io
                </a>{' '}
                project and its contributors.
              </p>
            </section>
            <section className="footer__block" aria-labelledby="footer-source">
              <h2 id="footer-source" className="footer__heading">
                <Github className="footer__icon" aria-hidden />
                Source & Contributors
              </h2>
              <p className="footer__text">
                Original project:{' '}
                <a
                  href="https://github.com/magicsword-io/LOLDrivers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  <Github className="footer__icon-inline" aria-hidden />
                  magicsword-io/LOLDrivers
                </a>
              </p>
              <p className="footer__text">
                This project:{' '}
                <a
                  href="https://github.com/didntchooseaname/loldrivers-database"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  <Github className="footer__icon-inline" aria-hidden />
                  didntchooseaname/loldrivers-database
                </a>
              </p>
            </section>
          </div>
          <div className="footer__bar">
            <p className="footer__disclaimer">
              Independent interface for educational and research purposes.
            </p>
            <div className="footer__actions">
              <button
                type="button"
                onClick={() => setShowTermsPopup(true)}
                className="footer__legal"
              >
                <Scale className="footer__icon-inline" aria-hidden />
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Help Dialog */}
      <HelpDialog
        open={showHelpPopup}
        onOpenChange={(o) => { setShowHelpPopup(o); if (!o) setShowScrollIndicator(true); }}
        title="About LOLDrivers Database"
        description="Technical definitions, project vision, and key terms for the LOLDrivers database."
        icon={<BookOpen className="h-5 w-5 text-muted-foreground" />}
      >
        {helpContent ? (
          <MarkdownRenderer content={helpContent.globalHelp} />
        ) : (
          <p className="text-muted-foreground">Loading help content...</p>
        )}
      </HelpDialog>

      {/* Filter Help Dialog */}
      <HelpDialog
        open={showFilterHelpPopup}
        onOpenChange={(o) => { setShowFilterHelpPopup(o); if (!o) setShowFilterHelpScrollIndicator(true); }}
        title="Filter Help – How Each Filter Works"
        description="Explanation of each filter option and how to apply them."
        icon={<Filter className="h-5 w-5 text-muted-foreground" />}
      >
        {helpContent ? (
          <MarkdownRenderer content={helpContent.filterHelp} />
        ) : (
          <p className="text-muted-foreground">Loading filter help...</p>
        )}
      </HelpDialog>

      {/* Authentihash Help Dialog */}
      <HelpDialog
        open={showAuthentihashHelpPopup}
        onOpenChange={setShowAuthentihashHelpPopup}
        title="Authentihash Information"
        description="What authentihashes are and how they are used for driver verification."
        icon={<Shield className="h-5 w-5 text-muted-foreground" />}
        showScrollIndicator={false}
      >
        {helpContent ? (
          <MarkdownRenderer content={helpContent.authentihashHelp} />
        ) : (
          <p className="text-muted-foreground">Loading authentihash help...</p>
        )}
      </HelpDialog>

      {/* Changelog Popup */}
      <ChangelogPopup 
        isVisible={showChangelogPopup}
        onClose={() => setShowChangelogPopup(false)}
      />

      {/* Terms Popup */}
      <TermsPopup 
        isVisible={showTermsPopup}
        onClose={() => setShowTermsPopup(false)}
      />
    </div>
  );
}
