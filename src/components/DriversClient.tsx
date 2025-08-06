'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import SafeDate from '@/components/SafeDate';
import HVCIBlocklistInfo from '@/components/HVCIBlocklistInfo';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ChangelogPopup } from '@/components/ChangelogPopup';
import { TermsPopup } from '@/components/TermsPopup';
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [showFilterHelpPopup, setShowFilterHelpPopup] = useState(false);
  const [showAuthentihashHelpPopup, setShowAuthentihashHelpPopup] = useState(false);
  const [showChangelogPopup, setShowChangelogPopup] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showFilterHelpScrollIndicator, setShowFilterHelpScrollIndicator] = useState(true);
  
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
  }, [pendingFilters]);

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
    setSearchQuery(inputValue.trim());
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

  // Fonction pour afficher le toast
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    const timeoutId = setTimeout(() => {
      setToastMessage(null);
    }, 3000); // Toast disappears after 3 seconds
    
    // Return cleanup function to allow cancellation if needed
    return () => clearTimeout(timeoutId);
  }, []);

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
        showToast('Link copied to clipboard!');
      } catch (error) {
        console.warn('Clipboard API failed:', error);
        showToast('Failed to copy link - please copy manually');
      }
    } catch (error) {
      console.error('Failed to create share URL:', error);
      showToast('Failed to create share link');
    }
  }, [searchQuery, activeFilters, currentPage, showToast]);

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

  // Function to scroll to bottom of help popup
  const scrollHelpToBottom = useCallback(() => {
    const helpPopup = document.querySelector('.help-popup') as HTMLDivElement;
    if (helpPopup) {
      helpPopup.scrollTo({
        top: helpPopup.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Function to scroll to bottom of filter help popup
  const scrollFilterHelpToBottom = useCallback(() => {
    const filterHelpPopup = document.querySelectorAll('.help-popup')[1] as HTMLDivElement; // Second popup (filter help)
    if (filterHelpPopup) {
      filterHelpPopup.scrollTo({
        top: filterHelpPopup.scrollHeight,
        behavior: 'smooth'
      });
    }
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

  // Gestion des sections collapsibles
  const renderHashTags = (hashes: { MD5?: string; SHA1?: string; SHA256?: string }, authentihash?: { MD5?: string; SHA1?: string; SHA256?: string }, index?: number) => {
    const copyToClipboard = async (hashType: string, hashValue: string) => {
      try {
        await navigator.clipboard.writeText(hashValue);
        showToast(`${hashType} hash copied to clipboard!`);
      } catch (err) {
        console.error('Failed to copy: ', err);
        showToast(`Failed to copy ${hashType} hash`);
      }
    };

    const hasStandardHashes = hashes.MD5 || hashes.SHA1 || hashes.SHA256;
    const hasAuthentihashes = authentihash?.MD5 || authentihash?.SHA1 || authentihash?.SHA256;
    
    if (!hasStandardHashes && !hasAuthentihashes) {
      return (
        <div className="hash-section">
          <div className="hash-section-header">
            <i className="fas fa-fingerprint"></i>
            <span className="hash-section-title">File Hashes</span>
          </div>
          <div className="hash-section-content">
            <span className="text-muted">No hashes available</span>
          </div>
        </div>
      );
    }

    const authentihashSectionId = `authentihash-${index || 0}`;
    const isAuthentihashExpanded = expandedSections.has(authentihashSectionId);

    return (
      <div className="hash-section">
        <div className="hash-section-header">
          <i className="fas fa-fingerprint"></i>
          <span className="hash-section-title">File Hashes</span>
        </div>
        <div className="hash-section-content">
          {/* Standard Hashes */}
          {hashes.MD5 && (
            <div 
              className="clickable-hash md5" 
              onClick={() => copyToClipboard('MD5', hashes.MD5!)}
              title="Click to copy MD5 hash"
            >
              <span className="hash-type">MD5</span>
              <span className="hash-value">{hashes.MD5}</span>
            </div>
          )}
          {hashes.SHA1 && (
            <div 
              className="clickable-hash sha1" 
              onClick={() => copyToClipboard('SHA1', hashes.SHA1!)}
              title="Click to copy SHA1 hash"
            >
              <span className="hash-type">SHA1</span>
              <span className="hash-value">{hashes.SHA1}</span>
            </div>
          )}
          {hashes.SHA256 && (
            <div 
              className="clickable-hash sha256" 
              onClick={() => copyToClipboard('SHA256', hashes.SHA256!)}
              title="Click to copy SHA256 hash"
            >
              <span className="hash-type">SHA256</span>
              <span className="hash-value">{hashes.SHA256}</span>
            </div>
          )}
          
          {/* Authentihash Collapsible Section */}
          {hasAuthentihashes && (
            <div className={`collapsible-section authentihash-section ${isAuthentihashExpanded ? 'expanded' : ''}`}>
              <div className="collapsible-header" onClick={() => toggleSection(authentihashSectionId)}>
                <span className="collapsible-title">
                  <div className="authentihash-title-section">
                    <i className="fas fa-shield-alt"></i> Authentihashes
                  </div>
                  <button
                    className="authentihash-help-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAuthentihashHelpPopup(true);
                    }}
                    title="Learn about Authentihashes"
                  >
                    <i className="fas fa-question-circle"></i>
                  </button>
                </span>
                <span className="collapsible-icon">
                  <i className={isAuthentihashExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'}></i>
                </span>
              </div>
              {isAuthentihashExpanded && (
                <div className="collapsible-content">
                  <div className="collapsible-inner">
                    {authentihash?.MD5 && (
                      <div 
                        className="clickable-hash md5" 
                        onClick={() => copyToClipboard('Authentihash MD5', authentihash.MD5!)}
                        title="Click to copy Authentihash MD5"
                      >
                        <span className="hash-type">MD5</span>
                        <span className="hash-value">{authentihash.MD5}</span>
                      </div>
                    )}
                    {authentihash?.SHA1 && (
                      <div 
                        className="clickable-hash sha1" 
                        onClick={() => copyToClipboard('Authentihash SHA1', authentihash.SHA1!)}
                        title="Click to copy Authentihash SHA1"
                      >
                        <span className="hash-type">SHA1</span>
                        <span className="hash-value">{authentihash.SHA1}</span>
                      </div>
                    )}
                    {authentihash?.SHA256 && (
                      <div 
                        className="clickable-hash sha256" 
                        onClick={() => copyToClipboard('Authentihash SHA256', authentihash.SHA256!)}
                        title="Click to copy Authentihash SHA256"
                      >
                        <span className="hash-type">SHA256</span>
                        <span className="hash-value">{authentihash.SHA256}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
        text: isTrue ? 'HVCI Compatible' : 'HVCI BLOCKED',
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

  // Render capacities section
  const renderCapacitiesSection = (capacities: Array<{ text: string; type: string; icon?: string }>) => {
    if (!capacities.length) return null;
    
    return (
      <div className="simple-section">
        <div className="simple-section-header">
          <i className="fas fa-cogs"></i>
          <span className="simple-section-title">Capacities</span>
        </div>
        <div className="simple-section-content">
          <div className="capacity-tags">
            {capacities.map((capacity, index) => (
              <span key={index} className={`capacity-tag ${capacity.type}`}>
                {capacity.icon && <i className={capacity.icon}></i>} {capacity.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStatusTags = (tags: Array<{ text: string; type: string; icon?: string }>) => {
    if (!tags.length) return null;
    
    return (
      <div className="status-tags">
        {tags.map((tag, index) => (
          <span key={index} className={`status-tag ${tag.type}`}>
            {tag.icon && <i className={tag.icon}></i>} {tag.text}
          </span>
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
      <div className="simple-section">
        <div className="simple-section-header">
          <i className={icon}></i>
          <span className="simple-section-title">{title}</span>
        </div>
        <div className="simple-section-content">
          {content}
        </div>
      </div>
    );
  };

  // Helper function to copy function name to clipboard
  const copyFunctionToClipboard = async (functionName: string) => {
    try {
      await navigator.clipboard.writeText(functionName);
      showToast(`Function "${functionName}" copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy function:', err);
      showToast('Failed to copy function to clipboard');
    }
  };

  // Imported functions section
  const renderImportedFunctionsSection = (functions: string[] | undefined, driver: Driver, index: number) => {
    // Si pas de fonctions ou tableau vide, affichage simple non-collapsible
    if (!functions || functions.length === 0) {
      return (
        <div className="simple-section">
          <div className="simple-section-header">
            <i className="fas fa-code"></i>
            <span className="simple-section-title">Imported Functions</span>
          </div>
          <div className="simple-section-content">
            No Imported Functions
          </div>
        </div>
      );
    }

    // Si des fonctions existent, section collapsible avec classification
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
      <div className={`collapsible-section ${isExpanded ? 'expanded' : ''}`} key={sectionId}>
        <div className="collapsible-header" onClick={() => toggleSection(sectionId)}>
          <span className="collapsible-title">
            <i className="fas fa-code"></i> Imported Functions ({functions.length})
          </span>
          <span className="collapsible-icon">
            <i className={isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'}></i>
          </span>
        </div>
        {isExpanded && (
          <div className="collapsible-content">
            <div className="collapsible-inner">
              {/* Critical functions first - expanded by default */}
              {categorizedFunctions.critical.length > 0 && (
                <div className="function-category collapsible-category">
                  <div 
                    className="category-title critical clickable-category"
                    onClick={() => toggleSection(`critical-${index}`)}
                    aria-expanded={expandedSections.has(`critical-${index}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="fas fa-exclamation-triangle"></i> 
                    <span>Critical Functions ({categorizedFunctions.critical.length})</span>
                    <i className={`fas ${expandedSections.has(`critical-${index}`) ? 'fa-chevron-down' : 'fa-chevron-right'} category-chevron`}></i>
                  </div>
                  {expandedSections.has(`critical-${index}`) && (
                    <ul className="functions-list category-functions-list">
                      {categorizedFunctions.critical.map((func, idx) => (
                        <li 
                          key={`critical-${idx}`} 
                          className="function-item dangerous clickable-function"
                          onClick={() => copyFunctionToClipboard(func)}
                          title={`Click to copy "${func}" to clipboard`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyFunctionToClipboard(func);
                            }
                          }}
                        >
                          <span className="function-name">{func}</span>
                          <i className="fas fa-copy copy-icon" aria-hidden="true"></i>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Gestion des processus */}
              {categorizedFunctions.process.length > 0 && (
                <div className="function-category collapsible-category">
                  <div 
                    className="category-title process clickable-category"
                    onClick={() => toggleSection(`process-${index}`)}
                    aria-expanded={expandedSections.has(`process-${index}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="fas fa-microchip"></i> 
                    <span>Process Management ({categorizedFunctions.process.length})</span>
                    <i className={`fas ${expandedSections.has(`process-${index}`) ? 'fa-chevron-down' : 'fa-chevron-right'} category-chevron`}></i>
                  </div>
                  {expandedSections.has(`process-${index}`) && (
                    <ul className="functions-list category-functions-list">
                      {categorizedFunctions.process.map((func, idx) => (
                        <li 
                          key={`process-${idx}`} 
                          className="function-item clickable-function"
                          onClick={() => copyFunctionToClipboard(func)}
                          title={`Click to copy "${func}" to clipboard`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyFunctionToClipboard(func);
                            }
                          }}
                        >
                          <span className="function-name">{func}</span>
                          <i className="fas fa-copy copy-icon" aria-hidden="true"></i>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Memory management */}
              {categorizedFunctions.memory.length > 0 && (
                <div className="function-category collapsible-category">
                  <div 
                    className="category-title memory clickable-category"
                    onClick={() => toggleSection(`memory-${index}`)}
                    aria-expanded={expandedSections.has(`memory-${index}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="fas fa-memory"></i> 
                    <span>Memory Management ({categorizedFunctions.memory.length})</span>
                    <i className={`fas ${expandedSections.has(`memory-${index}`) ? 'fa-chevron-down' : 'fa-chevron-right'} category-chevron`}></i>
                  </div>
                  {expandedSections.has(`memory-${index}`) && (
                    <ul className="functions-list category-functions-list">
                      {categorizedFunctions.memory.map((func, idx) => (
                        <li 
                          key={`memory-${idx}`} 
                          className="function-item clickable-function"
                          onClick={() => copyFunctionToClipboard(func)}
                          title={`Click to copy "${func}" to clipboard`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyFunctionToClipboard(func);
                            }
                          }}
                        >
                          <span className="function-name">{func}</span>
                          <i className="fas fa-copy copy-icon" aria-hidden="true"></i>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* File system */}
              {categorizedFunctions.file.length > 0 && (
                <div className="function-category collapsible-category">
                  <div 
                    className="category-title file clickable-category"
                    onClick={() => toggleSection(`file-${index}`)}
                    aria-expanded={expandedSections.has(`file-${index}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="fas fa-file"></i> 
                    <span>File System ({categorizedFunctions.file.length})</span>
                    <i className={`fas ${expandedSections.has(`file-${index}`) ? 'fa-chevron-down' : 'fa-chevron-right'} category-chevron`}></i>
                  </div>
                  {expandedSections.has(`file-${index}`) && (
                    <ul className="functions-list category-functions-list">
                      {categorizedFunctions.file.map((func, idx) => (
                        <li 
                          key={`file-${idx}`} 
                          className="function-item clickable-function"
                          onClick={() => copyFunctionToClipboard(func)}
                          title={`Click to copy "${func}" to clipboard`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyFunctionToClipboard(func);
                            }
                          }}
                        >
                          <span className="function-name">{func}</span>
                          <i className="fas fa-copy copy-icon" aria-hidden="true"></i>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Registre */}
              {categorizedFunctions.registry.length > 0 && (
                <div className="function-category collapsible-category">
                  <div 
                    className="category-title registry clickable-category"
                    onClick={() => toggleSection(`registry-${index}`)}
                    aria-expanded={expandedSections.has(`registry-${index}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="fas fa-database"></i> 
                    <span>Registry ({categorizedFunctions.registry.length})</span>
                    <i className={`fas ${expandedSections.has(`registry-${index}`) ? 'fa-chevron-down' : 'fa-chevron-right'} category-chevron`}></i>
                  </div>
                  {expandedSections.has(`registry-${index}`) && (
                    <ul className="functions-list category-functions-list">
                      {categorizedFunctions.registry.map((func, idx) => (
                        <li 
                          key={`registry-${idx}`} 
                          className="function-item clickable-function"
                          onClick={() => copyFunctionToClipboard(func)}
                          title={`Click to copy "${func}" to clipboard`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyFunctionToClipboard(func);
                            }
                          }}
                        >
                          <span className="function-name">{func}</span>
                          <i className="fas fa-copy copy-icon" aria-hidden="true"></i>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Network */}
              {categorizedFunctions.network.length > 0 && (
                <div className="function-category collapsible-category">
                  <div 
                    className="category-title network clickable-category"
                    onClick={() => toggleSection(`network-${index}`)}
                    aria-expanded={expandedSections.has(`network-${index}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="fas fa-network-wired"></i> 
                    <span>Network ({categorizedFunctions.network.length})</span>
                    <i className={`fas ${expandedSections.has(`network-${index}`) ? 'fa-chevron-down' : 'fa-chevron-right'} category-chevron`}></i>
                  </div>
                  {expandedSections.has(`network-${index}`) && (
                    <ul className="functions-list category-functions-list">
                      {categorizedFunctions.network.map((func, idx) => (
                        <li 
                          key={`network-${idx}`} 
                          className="function-item clickable-function"
                          onClick={() => copyFunctionToClipboard(func)}
                          title={`Click to copy "${func}" to clipboard`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyFunctionToClipboard(func);
                            }
                          }}
                        >
                          <span className="function-name">{func}</span>
                          <i className="fas fa-copy copy-icon" aria-hidden="true"></i>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Security */}
              {categorizedFunctions.security.length > 0 && (
                <div className="function-category collapsible-category">
                  <div 
                    className="category-title security clickable-category"
                    onClick={() => toggleSection(`security-${index}`)}
                    aria-expanded={expandedSections.has(`security-${index}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="fas fa-shield-alt"></i> 
                    <span>Security ({categorizedFunctions.security.length})</span>
                    <i className={`fas ${expandedSections.has(`security-${index}`) ? 'fa-chevron-down' : 'fa-chevron-right'} category-chevron`}></i>
                  </div>
                  {expandedSections.has(`security-${index}`) && (
                    <ul className="functions-list category-functions-list">
                      {categorizedFunctions.security.map((func, idx) => (
                        <li 
                          key={`security-${idx}`} 
                          className="function-item clickable-function"
                          onClick={() => copyFunctionToClipboard(func)}
                          title={`Click to copy "${func}" to clipboard`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyFunctionToClipboard(func);
                            }
                          }}
                        >
                          <span className="function-name">{func}</span>
                          <i className="fas fa-copy copy-icon" aria-hidden="true"></i>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Fonctions kernel */}
              {categorizedFunctions.kernel.length > 0 && (
                <div className="function-category collapsible-category">
                  <div 
                    className="category-title kernel clickable-category"
                    onClick={() => toggleSection(`kernel-${index}`)}
                    aria-expanded={expandedSections.has(`kernel-${index}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="fas fa-cog"></i> 
                    <span>Kernel/System ({categorizedFunctions.kernel.length})</span>
                    <i className={`fas ${expandedSections.has(`kernel-${index}`) ? 'fa-chevron-down' : 'fa-chevron-right'} category-chevron`}></i>
                  </div>
                  {expandedSections.has(`kernel-${index}`) && (
                    <ul className="functions-list category-functions-list">
                      {categorizedFunctions.kernel.map((func, idx) => (
                        <li 
                          key={`kernel-${idx}`} 
                          className="function-item clickable-function"
                          onClick={() => copyFunctionToClipboard(func)}
                          title={`Click to copy "${func}" to clipboard`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyFunctionToClipboard(func);
                            }
                          }}
                        >
                          <span className="function-name">{func}</span>
                          <i className="fas fa-copy copy-icon" aria-hidden="true"></i>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Autres fonctions */}
              {categorizedFunctions.other.length > 0 && (
                <div className="function-category collapsible-category">
                  <div 
                    className="category-title other clickable-category"
                    onClick={() => toggleSection(`other-${index}`)}
                    aria-expanded={expandedSections.has(`other-${index}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="fas fa-ellipsis-h"></i> 
                    <span>Other ({categorizedFunctions.other.length})</span>
                    <i className={`fas ${expandedSections.has(`other-${index}`) ? 'fa-chevron-down' : 'fa-chevron-right'} category-chevron`}></i>
                  </div>
                  {expandedSections.has(`other-${index}`) && (
                    <ul className="functions-list category-functions-list">
                      {categorizedFunctions.other.map((func, idx) => (
                        <li 
                          key={`other-${idx}`} 
                          className="function-item clickable-function"
                          onClick={() => copyFunctionToClipboard(func)}
                          title={`Click to copy "${func}" to clipboard`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyFunctionToClipboard(func);
                            }
                          }}
                        >
                          <span className="function-name">{func}</span>
                          <i className="fas fa-copy copy-icon" aria-hidden="true"></i>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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
      <div className={`collapsible-section ${isExpanded ? 'expanded' : ''}`} key={sectionId}>
        <div className="collapsible-header" onClick={() => toggleSection(sectionId)}>
          <span className="collapsible-title">
            <i className="fas fa-external-link-alt"></i> Resources ({filteredResources.length})
          </span>
          <span className="collapsible-icon">
            <i className={isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'}></i>
          </span>
        </div>
        {isExpanded && (
          <div className="collapsible-content">
            <div className="collapsible-inner">
              <div className="resources-list">
                {filteredResources.map((resource, resourceIndex) => {
                  if (!resource || !resource.trim()) return null;
                  
                  // Extract domain for favicon and display name
                  let domain = '';
                  let displayName = resource;
                  try {
                    const url = new URL(resource);
                    domain = url.hostname;
                    // Create a shorter display name
                    displayName = `${domain}${url.pathname}`;
                    if (displayName.length > 60) {
                      displayName = displayName.substring(0, 57) + '...';
                    }
                  } catch {
                    // If URL parsing fails, use the resource as is
                    displayName = resource.length > 60 ? resource.substring(0, 57) + '...' : resource;
                  }

                  const faviconUrl = domain && domain.length > 0 && domain.length < 100 
                    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16` 
                    : null;
                  
                  return (
                    <div 
                      key={`resource-${resourceIndex}`}
                      className="clickable-hash resource-link"
                      onClick={() => window.open(resource, '_blank', 'noopener,noreferrer')}
                      title={resource}
                    >
                      <span className="hash-type">
                        {faviconUrl ? (
                          <Image 
                            src={faviconUrl} 
                            alt={`${domain} favicon`}
                            width={16} 
                            height={16}
                            onError={() => {
                              // Fallback to Font Awesome icon if favicon fails to load
                            }}
                            style={{ display: 'inline-block' }}
                          />
                        ) : null}
                        <i className="fas fa-external-link-alt" style={{ display: faviconUrl ? 'none' : 'inline' }}></i>
                      </span>
                      <span className="hash-value">{displayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };



  // Section des commandes
  const renderCommandsSection = (commands: Driver['Commands'], driver: Driver, index: number) => {
    if (!commands || typeof commands !== 'object') return null;
    
    const sectionId = `commands-${index}`;
    const isExpanded = expandedSections.has(sectionId);
    
    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Command copied to clipboard!');
      }).catch(() => {
        showToast('Failed to copy command');
      });
    };
    
    return (
      <div className={`collapsible-section ${isExpanded ? 'expanded' : ''}`} key={sectionId}>
        <div className="collapsible-header" onClick={() => toggleSection(sectionId)}>
          <span className="collapsible-title">
            <i className="fas fa-terminal"></i> Commands & Usage
          </span>
          <span className="collapsible-icon">
            <i className={isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'}></i>
          </span>
        </div>
        {isExpanded && (
          <div className="collapsible-content">
            <div className="collapsible-inner">
              {commands.OperatingSystem && (
                <div className="command-field">
                  <div className="command-field-header">
                    <i className="fas fa-desktop"></i>
                    <strong>Operating System</strong>
                  </div>
                  <div className="command-field-content">{commands.OperatingSystem}</div>
                </div>
              )}
              {commands.Privileges && (
                <div className="command-field">
                  <div className="command-field-header">
                    <i className="fas fa-user-shield"></i>
                    <strong>Privileges</strong>
                  </div>
                  <div className="command-field-content">{commands.Privileges}</div>
                </div>
              )}
              {commands.Usecase && (
                <div className="command-field">
                  <div className="command-field-header">
                    <i className="fas fa-bullseye"></i>
                    <strong>Use Case</strong>
                  </div>
                  <div className="command-field-content">{commands.Usecase}</div>
                </div>
              )}
              {commands.Command && commands.Command.trim() && (
                <div className="command-field">
                  <div className="command-field-header">
                    <i className="fas fa-code"></i>
                    <strong>Command</strong>
                  </div>
                  <div className="terminal-window">
                    <div className="terminal-header">
                      <div className="terminal-buttons">
                        <span className="terminal-button red"></span>
                        <span className="terminal-button yellow"></span>
                        <span className="terminal-button green"></span>
                      </div>
                      <div className="terminal-title">Command Prompt</div>
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(commands.Command || '')}
                        title="Copy command"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                    <div className="terminal-content">
                      <code>{commands.Command}</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
      showToast('No MD5 hash available for download');
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
    
    showToast(`Downloading ${filename}...`);
  }, [showToast]);

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
    
    return (
      <div className="driver-card" key={`driver-${index}-${driver.MD5 || driver.SHA256}`}>
        <div className="driver-header">
          <h3 className="driver-title">
            <i className="fas fa-microchip"></i> {filename}
            {formattedArch && (
              <span className="driver-architecture">{formattedArch}</span>
            )}
          </h3>
          <button 
            className="download-btn"
            onClick={() => downloadDriver(driver)}
            title={`Download ${filename}`}
            aria-label={`Download ${filename}`}
          >
            <i className="fas fa-download"></i>
          </button>
        </div>
        
        {renderStatusTags(statusTags)}
        {certificateTags.length > 0 && (
          <div className="certificate-tags-section">
            {renderStatusTags(certificateTags)}
          </div>
        )}
        {renderHashTags(hashes, driver.Authentihash, index)}
        {renderSimpleSection('Company', driver.Company || 'Unknown', 'fas fa-building')}
        {renderSimpleSection('Description', getBestDescription(driver), 'fas fa-info-circle')}
        {driver.Category && renderSimpleSection('Category', driver.Category, 'fas fa-tags')}
        {driver.Author && renderSimpleSection('Author', driver.Author, 'fas fa-user')}
        {driver.Created && renderSimpleSection('Created Date', driver.Created, 'fas fa-calendar')}
        {renderCapacitiesSection(capacityTags)}
        {renderCommandsSection(driver.Commands, driver, index)}
        {renderImportedFunctionsSection(driver.ImportedFunctions, driver, index)}
        {renderResourcesSection(driver.Resources, driver, index)}
      </div>
    );
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-top">
          <div className="header-content">
            <h1>LOLDrivers Database</h1>
            <p className="header-subtitle">Vulnerable and malicious Windows drivers database</p>
            <p className="last-updated">
              <SafeDate 
                date={statsData?.stats?.lastUpdated || null}
                prefix="Last updated: "
                fallback="Loading..."
              />
            </p>
          </div>
          <div className="header-controls">
            <button 
              className="changelog-button"
              onClick={() => setShowChangelogPopup(true)}
              title="View changelog and recent updates"
              aria-label="View changelog and recent updates"
            >
              <i className="fas fa-history"></i>
            </button>
            <button 
              className="share-button"
              onClick={shareCurrentSearch}
              title="Share current search and filters"
              aria-label="Share current search and filters"
            >
              <i className="fas fa-share"></i>
            </button>
            <button 
              className="help-button" 
              onClick={() => setShowHelpPopup(true)}
              aria-label="Help - Technical Definitions"
              title="Help - Technical Definitions"
            >
              <i className="fas fa-question-circle"></i>
            </button>
            <button id="themeToggle" className="theme-toggle" aria-label="Toggle theme">
              <div className="theme-toggle-track">
                <div className="theme-toggle-thumb">
                  <span className="theme-icon theme-icon-sun">☀️</span>
                  <span className="theme-icon theme-icon-moon">🌙</span>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <div className="stats-section">
          <div className="stat-item">
            <span className="stat-label">
              <i className="fas fa-database"></i> Total Drivers
            </span>
            <span className="stat-value">{statsData?.stats?.total || 0}</span>
          </div>
          <div 
            className={`stat-item clickable hvci-item ${activeFilters.has('hvci') ? 'active' : ''}`}
            onClick={() => applyDirectFilter('hvci')}
          >
            <span className="stat-label">
              <i className="fas fa-check"></i> HVCI Compatible
            </span>
            <span className="stat-value">{statsData?.stats?.hvciCompatible || 0}</span>
          </div>
          <div 
            className={`stat-item clickable process-killer-item ${activeFilters.has('process-killer') ? 'active' : ''}`}
            onClick={() => applyDirectFilter('process-killer')}
          >
            <span className="stat-label">
              <i className="fas fa-skull"></i> Process Killer Drivers
            </span>
            <span className="stat-value">{statsData?.stats?.processKillerDrivers || 0}</span>
          </div>
        </div>
        
        {/* HVCI Blocklist Information */}
        <HVCIBlocklistInfo stats={statsData?.stats} />
      </header>

      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              className="form-control search-input" 
              placeholder="Search drivers by name, hash, company, description..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>
          <button 
            className="btn btn--primary search-button"
            onClick={performSearch}
            disabled={isLoading}
          >
            <i className="fas fa-search"></i> {isLoading ? 'Searching...' : 'Search'}
          </button>
          <button 
            className={`btn btn--outline btn--sm clear-button ${(!searchQuery.trim() && activeFilters.size === 0) ? 'disabled' : ''}`}
            onClick={clearAllFilters}
            disabled={!searchQuery.trim() && activeFilters.size === 0}
          >
            <i className="fas fa-eraser"></i> Clear
          </button>
        </div>
        
        <div className="filter-options">
          <div className="filter-group">
            <span className="filter-label"><i className="fas fa-filter"></i> Quick Filters:</span>
            <button 
              className={`filter-btn hvci-filter ${pendingFilters.has('hvci') ? 'active' : ''}`}
              onClick={() => toggleFilter('hvci')}
            >
              <i className="fas fa-check"></i> HVCI Compatible
            </button>

            <button 
              className={`filter-btn trusted-cert-filter ${pendingFilters.has('trusted-cert') ? 'active' : ''} ${pendingFilters.has('untrusted-cert') ? 'disabled' : ''}`}
              onClick={() => toggleFilter('trusted-cert')}
              disabled={pendingFilters.has('untrusted-cert')}
            >
              <i className="fas fa-certificate"></i> Trusted Certificate
            </button>
            <button 
              className={`filter-btn untrusted-cert-filter ${pendingFilters.has('untrusted-cert') ? 'active' : ''} ${pendingFilters.has('trusted-cert') ? 'disabled' : ''}`}
              onClick={() => toggleFilter('untrusted-cert')}
              disabled={pendingFilters.has('trusted-cert')}
            >
              <i className="fas fa-exclamation-triangle"></i> Unknown Certificate
            </button>
            <button 
              className={`filter-btn ${pendingFilters.has('recent') ? 'active' : ''}`}
              onClick={() => toggleFilter('recent')}
            >
              <i className="fas fa-clock"></i> Recent Drivers
            </button>
            <button 
              className={`filter-btn ${pendingFilters.has('newest-first') ? 'active' : ''} ${pendingFilters.has('oldest-first') ? 'disabled' : ''}`}
              onClick={() => toggleFilter('newest-first')}
              disabled={pendingFilters.has('oldest-first')}
            >
              <i className="fas fa-sort-amount-down"></i> Newest First
            </button>
            <button 
              className={`filter-btn ${pendingFilters.has('oldest-first') ? 'active' : ''} ${pendingFilters.has('newest-first') ? 'disabled' : ''}`}
              onClick={() => toggleFilter('oldest-first')}
              disabled={pendingFilters.has('newest-first')}
            >
              <i className="fas fa-sort-amount-up"></i> Oldest First
            </button>
          </div>
          
          <div className="filter-group advanced-filters">
            <span className="filter-label"><i className="fas fa-cogs"></i> Behaviors:</span>
            <button 
              className={`filter-btn process-killer-filter ${pendingFilters.has('process-killer') ? 'active' : ''}`}
              onClick={() => toggleFilter('process-killer')}
            >
              <i className="fas fa-skull-crossbones"></i> Process Killer
            </button>
            <button 
              className={`filter-btn behavior-filter ${pendingFilters.has('memory-manipulator') ? 'active' : ''}`}
              onClick={() => toggleFilter('memory-manipulator')}
            >
              <i className="fas fa-memory"></i> Memory Manipulator
            </button>
            <button 
              className={`filter-btn behavior-filter ${pendingFilters.has('debug-bypass') ? 'active' : ''}`}
              onClick={() => toggleFilter('debug-bypass')}
            >
              <i className="fas fa-bug"></i> Debug Bypass
            </button>
            <button 
              className={`filter-btn behavior-filter ${pendingFilters.has('registry-manipulator') ? 'active' : ''}`}
              onClick={() => toggleFilter('registry-manipulator')}
            >
              <i className="fas fa-edit"></i> Registry Manipulator
            </button>
            <button 
              className={`filter-btn behavior-filter ${pendingFilters.has('file-manipulator') ? 'active' : ''}`}
              onClick={() => toggleFilter('file-manipulator')}
            >
              <i className="fas fa-file-alt"></i> File Manipulator
            </button>
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
            <span className="filter-label"><i className="fas fa-microchip"></i> Architecture:</span>
            <button 
              className={`filter-btn arch-filter ${pendingFilters.has('architecture-AMD64') ? 'active' : ''}`}
              onClick={() => toggleFilter('architecture-AMD64')}
            >
              <i className="fas fa-microchip"></i> x64
            </button>
            <button 
              className={`filter-btn arch-filter ${pendingFilters.has('architecture-I386') ? 'active' : ''}`}
              onClick={() => toggleFilter('architecture-I386')}
            >
              <i className="fas fa-microchip"></i> x32
            </button>
            <button 
              className={`filter-btn arch-filter ${pendingFilters.has('architecture-ARM64') ? 'active' : ''}`}
              onClick={() => toggleFilter('architecture-ARM64')}
            >
              <i className="fas fa-microchip"></i> arm64
            </button>
          </div>
          
          <div className="filter-group control-filters">
            <button 
              className="btn btn--primary apply-filters-btn"
              onClick={applyFilters}
              disabled={pendingFilters.size === 0 && searchQuery.trim() === ''}
            >
              <i className="fas fa-check"></i> Apply Filters
            </button>
            <button 
              className={`filter-btn clear ${(!searchQuery.trim() && activeFilters.size === 0) ? 'disabled' : ''}`}
              onClick={clearAllFilters}
              disabled={!searchQuery.trim() && activeFilters.size === 0}
            >
              <i className="fas fa-times"></i> Clear Filters
            </button>
            <button 
              className="filter-btn help-filter-btn"
              onClick={() => setShowFilterHelpPopup(true)}
              title="How filters work"
            >
              <i className="fas fa-question-circle"></i> Filter Help
            </button>
          </div>
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
        
        <div className="search-stats">
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

      <div className="drivers-grid">        
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <div className="toast-content">
            <i className="fas fa-check-circle"></i>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button 
          className="back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <i className="fas fa-chevron-up"></i>
        </button>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4 className="footer-title">
              <i className="fas fa-heart"></i> Special Thanks
            </h4>
            <p className="footer-text">
              This database is based on the amazing work from the{' '}
              <a 
                href="https://loldrivers.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                LOLDrivers.io
              </a>{' '}
              project and its contributors.
            </p>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">
              <i className="fab fa-github"></i> Source & Contributors
            </h4>
            <p className="footer-text">
              Original project:{' '}
              <a 
                href="https://github.com/magicsword-io/LOLDrivers" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                <i className="fab fa-github"></i> magicsword-io/LOLDrivers
              </a>
            </p>
                        <p className="footer-text">
              This project:{' '}
              <a 
                href="https://github.com/didntchooseaname/loldrivers-database" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                <i className="fab fa-github"></i> didntchooseaname/loldrivers-database
              </a>
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-disclaimer">
            This is an independent interface for educational and research purposes.
          </p>
          <div className="footer-links">
            <button 
              onClick={() => setShowTermsPopup(true)}
              className="footer-legal-link"
            >
              <i className="fas fa-gavel"></i> Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Help Popup */}
      {showHelpPopup && (
        <div className="help-popup-overlay" onClick={() => {
          setShowHelpPopup(false);
          setShowScrollIndicator(true); // Reset scroll indicator when closing
        }}>
          <div 
            className="help-popup" 
            onClick={(e) => e.stopPropagation()}
            onScroll={(e) => {
              const element = e.target as HTMLDivElement;
              const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
              setShowScrollIndicator(!isAtBottom);
              
              // Hide scroll indicator as soon as user starts scrolling
              if (element.scrollTop > 0) {
                setShowScrollIndicator(false);
              }
            }}
          >
            <button 
              className="help-popup-close"
              onClick={() => {
                setShowHelpPopup(false);
                setShowScrollIndicator(true); // Reset scroll indicator when closing
              }}
              aria-label="Close help"
            >
              <i className="fas fa-times"></i>
            </button>
            
            <h3>
              <i className="fas fa-book"></i> About LOLDrivers Database - Project Vision & Capabilities
            </h3>
            
            <div className="help-intro">
              {helpContent ? (
                <MarkdownRenderer content={helpContent.globalHelp} />
              ) : (
                <div className="loading-content">
                  <p>Loading help content...</p>
                </div>
              )}
            </div>

            {showScrollIndicator && (
              <div 
                className="help-scroll-indicator"
                onClick={scrollHelpToBottom}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollHelpToBottom();
                  }
                }}
                aria-label="Scroll to bottom for more information"
              >
                <i className="fas fa-chevron-down"></i>
                <span>Scroll for more information</span>
                <i className="fas fa-chevron-down"></i>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Help Popup */}
      {showFilterHelpPopup && (
        <div className="help-popup-overlay" onClick={() => {
          setShowFilterHelpPopup(false);
          setShowFilterHelpScrollIndicator(true); // Reset scroll indicator when closing
        }}>
          <div 
            className="help-popup" 
            onClick={(e) => e.stopPropagation()}
            onScroll={(e) => {
              const element = e.target as HTMLDivElement;
              const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
              setShowFilterHelpScrollIndicator(!isAtBottom);
              
              // Hide scroll indicator as soon as user starts scrolling
              if (element.scrollTop > 0) {
                setShowFilterHelpScrollIndicator(false);
              }
            }}
          >
            <button 
              className="help-popup-close"
              onClick={() => {
                setShowFilterHelpPopup(false);
                setShowFilterHelpScrollIndicator(true); // Reset scroll indicator when closing
              }}
              aria-label="Close filter help"
            >
              <i className="fas fa-times"></i>
            </button>
            
            <h3>
              <i className="fas fa-filter"></i> Filter Help - How Each Filter Works
            </h3>
            
            {helpContent ? (
              <MarkdownRenderer content={helpContent.filterHelp} />
            ) : (
              <div className="loading-content">
                <p>Loading filter help content...</p>
              </div>
            )}

            {showFilterHelpScrollIndicator && (
              <div 
                className="help-scroll-indicator"
                onClick={scrollFilterHelpToBottom}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollFilterHelpToBottom();
                  }
                }}
                aria-label="Scroll to bottom for more information"
              >
                <i className="fas fa-chevron-down"></i>
                <span>Scroll for more information</span>
                <i className="fas fa-chevron-down"></i>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentihash Help Popup */}
      {showAuthentihashHelpPopup && (
        <div className="help-popup-overlay" onClick={() => setShowAuthentihashHelpPopup(false)}>
          <div 
            className="help-popup" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="help-popup-close"
              onClick={() => setShowAuthentihashHelpPopup(false)}
              aria-label="Close authentihash help"
            >
              <i className="fas fa-times"></i>
            </button>
            
            <h3>
              <i className="fas fa-shield-alt"></i> Authentihash Information
            </h3>
            
            {helpContent ? (
              <MarkdownRenderer content={helpContent.authentihashHelp} />
            ) : (
              <div className="loading-content">
                <p>Loading authentihash help content...</p>
              </div>
            )}
          </div>
        </div>
      )}

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
