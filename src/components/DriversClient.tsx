'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import SafeDate from '@/components/SafeDate';
import type { Driver, DriversResponse, Stats } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DriversClient({ 
  initialDrivers, 
  initialStats 
}: { 
  initialDrivers: DriversResponse;
  initialStats: { success: boolean; stats: Stats };
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState(''); // Nouvelle valeur pour l'input
  const [activeFilters, setActiveFilters] = useState(new Set<string>());
  const [pendingFilters, setPendingFilters] = useState(new Set<string>()); // Filtres en attente
  const [expandedSections, setExpandedSections] = useState(new Set<string>());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Utilisation de SWR pour la recherche côté serveur
  const searchKey = useMemo(() => {
    if (!searchQuery.trim() && activeFilters.size === 0) {
      return null; // Pas de recherche, utiliser les données initiales
    }
    
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery);
    if (activeFilters.has('hvci')) params.set('hvci', 'true');
    if (activeFilters.has('killer')) params.set('killer', 'true');
    if (activeFilters.has('signed')) params.set('signed', 'true');
    if (activeFilters.has('unsigned')) params.set('unsigned', 'true');
    if (activeFilters.has('recent')) params.set('recent', 'true');
    if (activeFilters.has('newest-first')) params.set('newest-first', 'true');
    if (activeFilters.has('oldest-first')) params.set('oldest-first', 'true');
    // Supprimer la limite pour récupérer tous les résultats
    
    return `/api/drivers?${params.toString()}`;
  }, [searchQuery, activeFilters]);

  const { data: searchData, isLoading } = useSWR<DriversResponse>(
    searchKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 secondes de cache pour les recherches
      revalidateOnMount: false,
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

  // Mémoriser les drivers à afficher (soit les résultats de recherche, soit les données initiales)
  const allDrivers = useMemo(() => {
    if (searchKey && searchData) {
      return searchData.drivers || [];
    }
    return initialDrivers.drivers || [];
  }, [searchKey, searchData, initialDrivers.drivers]);

  // Calculs de pagination
  const totalItems = allDrivers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  // Drivers paginés pour la page actuelle
  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allDrivers.slice(startIndex, endIndex);
  }, [allDrivers, currentPage, ITEMS_PER_PAGE]);

  // Réinitialiser la page à 1 quand les filtres ou la recherche changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters]);

  // Supprimer l'ancien état filteredDrivers car on utilise maintenant paginatedDrivers
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>(paginatedDrivers);

  // Mettre à jour filteredDrivers quand paginatedDrivers change
  useEffect(() => {
    setFilteredDrivers(paginatedDrivers);
  }, [paginatedDrivers]);

  // Vérifier certificat actif
  const hasActiveCertificate = (driver: Driver): boolean => {
    if (!driver.Signatures || !Array.isArray(driver.Signatures)) {
      return false;
    }

    for (const signature of driver.Signatures) {
      if (signature.Certificates && Array.isArray(signature.Certificates)) {
        for (const cert of signature.Certificates) {
          if (cert.ValidTo) {
            try {
              const validTo = new Date(cert.ValidTo);
              const now = new Date();
              if (validTo > now) {
                return true;
              }
            } catch {
              continue;
            }
          }
        }
      }
    }
    return false;
  };

  // Gestion des filtres
  const toggleFilter = useCallback((filterType: string) => {
    setPendingFilters(prev => {
      const newFilters = new Set(prev);
      
      // Logique pour les filtres mutuellement exclusifs
      if (filterType === 'signed' && newFilters.has('unsigned')) {
        newFilters.delete('unsigned');
      } else if (filterType === 'unsigned' && newFilters.has('signed')) {
        newFilters.delete('signed');
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
    // Si le filtre est déjà actif, le désactiver (toggle)
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
  }, [activeFilters]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setInputValue('');
    setActiveFilters(new Set());
    setPendingFilters(new Set());
  }, []);

  // Fonction pour effectuer la recherche
  const performSearch = useCallback(() => {
    setSearchQuery(inputValue.trim());
  }, [inputValue]);

  // Fonction pour gérer la touche Entrée
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  }, [performSearch]);

  // Fonction pour afficher le toast
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000); // Toast disparaît après 3 secondes
  }, []);

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

  // Gestion des sections collapsibles
  const renderHashTags = (hashes: { MD5?: string; SHA1?: string; SHA256?: string }) => {
    const copyToClipboard = async (hashType: string, hashValue: string) => {
      try {
        await navigator.clipboard.writeText(hashValue);
        showToast(`${hashType} hash copied to clipboard!`);
      } catch (err) {
        console.error('Failed to copy: ', err);
        showToast(`Failed to copy ${hashType} hash`);
      }
    };

    const hasHashes = hashes.MD5 || hashes.SHA1 || hashes.SHA256;
    
    if (!hasHashes) {
      return (
        <div className="hash-section">
          <div className="hash-section-header">
            <i className="fas fa-fingerprint"></i>
            <span className="hash-section-title">Hashes</span>
          </div>
          <div className="hash-section-content">
            <span className="text-muted">No hashes available</span>
          </div>
        </div>
      );
    }

    return (
      <div className="hash-section">
        <div className="hash-section-header">
          <i className="fas fa-fingerprint"></i>
          <span className="hash-section-title">Hashes</span>
        </div>
        <div className="hash-section-content">
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
        </div>
      </div>
    );
  };

  // Générer les status tags
  const generateStatusTags = (driver: Driver) => {
    const tags = [];
    
    if (driver.LoadsDespiteHVCI) {
      const isTrue = driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE';
      tags.push({
        text: isTrue ? 'HVCI PASSED' : 'HVCI BLOCKED',
        type: isTrue ? 'success' : 'danger',
        icon: isTrue ? 'fas fa-check-circle' : 'fas fa-times-circle'
      });
    }
    
    if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
      const hasKillerFunction = driver.ImportedFunctions.some(func => 
        func.toLowerCase().includes('zwterminateprocess') ||
        func.toLowerCase().includes('zwkillprocess') ||
        func.toLowerCase().includes('ntterminate')
      );
      if (hasKillerFunction) {
        tags.push({
          text: 'KILLER',
          type: 'danger',
          icon: 'fas fa-skull-crossbones'
        });
      }
    }
    
    if (hasActiveCertificate(driver)) {
      tags.push({
        text: 'VALID CERTIFICATE',
        type: 'success',
        icon: 'fas fa-certificate'
      });
    }
    
    return tags;
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

  // Section des fonctions importées
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

    // Si des fonctions existent, section collapsible
    const sectionId = `functions-${index}`;
    const isExpanded = expandedSections.has(sectionId);
    
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
              <ul className="functions-list functions-scrollable">
                {functions.map((func, idx) => {
                  const isDangerous = func.toLowerCase().includes('zwterminateprocess') ||
                                    func.toLowerCase().includes('zwkillprocess') ||
                                    func.toLowerCase().includes('ntterminate');
                  
                  return (
                    <li key={idx} className={`function-item ${isDangerous ? 'dangerous' : ''}`}>
                      {func}
                    </li>
                  );
                })}
              </ul>
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
                  } catch (e) {
                    // If URL parsing fails, use the resource as is
                    displayName = resource.length > 60 ? resource.substring(0, 57) + '...' : resource;
                  }

                  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : null;
                  
                  return (
                    <div 
                      key={`resource-${resourceIndex}`}
                      className="clickable-hash resource-link"
                      onClick={() => window.open(resource, '_blank', 'noopener,noreferrer')}
                      title={resource}
                    >
                      <span className="hash-type">
                        {faviconUrl ? (
                          <img 
                            src={faviconUrl} 
                            alt={`${domain} favicon`}
                            width="16" 
                            height="16"
                            onError={(e) => {
                              // Fallback to Font Awesome icon if favicon fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const icon = target.nextElementSibling as HTMLElement;
                              if (icon) icon.style.display = 'inline';
                            }}
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

  // Section Description des commandes (placée après les Hashes)
  const renderCommandDescription = (commands: Driver['Commands']) => {
    if (!commands || !commands.Description) return null;
    
    return (
      <div className="command-field">
        <div className="command-field-header">
          <i className="fas fa-file-text"></i>
          <strong>Description</strong>
        </div>
        <div className="command-field-content">{commands.Description}</div>
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

  // Fonction pour télécharger un driver
  const downloadDriver = useCallback((driver: Driver) => {
    const hash = driver.MD5;
    const filename = driver.OriginalFilename || driver.Filename || 'driver';
    
    if (!hash) {
      showToast('No MD5 hash available for download');
      return;
    }
    
    // Créer l'URL de téléchargement basée sur le hash MD5
    const downloadUrl = `https://github.com/magicsword-io/LOLDrivers/raw/main/drivers/${hash}.bin`;
    
    // Créer un lien temporaire pour déclencher le téléchargement
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Downloading ${filename}...`);
  }, [showToast]);

  // Créer une carte driver
  const createDriverCard = (driver: Driver, index: number) => {
    const hashes = {
      MD5: driver.MD5 || (driver.Authentihash && driver.Authentihash.MD5),
      SHA1: driver.SHA1 || (driver.Authentihash && driver.Authentihash.SHA1),
      SHA256: driver.SHA256 || (driver.Authentihash && driver.Authentihash.SHA256)
    };
    const statusTags = generateStatusTags(driver);
    const filename = driver.OriginalFilename || driver.Filename || 'Unknown Driver';
    
    return (
      <div className="driver-card" key={`driver-${index}-${driver.MD5 || driver.SHA256}`}>
        <div className="driver-header">
          <h3 className="driver-title">
            <i className="fas fa-microchip"></i> {filename}
            <button 
              className="download-btn"
              onClick={() => downloadDriver(driver)}
              title={`Download ${filename}`}
              aria-label={`Download ${filename}`}
            >
              <i className="fas fa-download"></i>
            </button>
          </h3>
          {renderStatusTags(statusTags)}
          {renderHashTags(hashes)}
          {renderSimpleSection('Company', driver.Company || 'Unknown', 'fas fa-building')}
          {renderCommandDescription(driver.Commands)}
        </div>
        
        {renderSimpleSection('Description', driver.Description || 'No description available', 'fas fa-info-circle')}
        {driver.Category && renderSimpleSection('Category', driver.Category, 'fas fa-tags')}
        {driver.Author && renderSimpleSection('Author', driver.Author, 'fas fa-user')}
        {driver.Created && renderSimpleSection('Created Date', driver.Created, 'fas fa-calendar')}
        {driver.MitreID && renderSimpleSection('MITRE ID', driver.MitreID, 'fas fa-shield-alt')}
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
          <button id="themeToggle" className="theme-toggle" aria-label="Toggle theme">
            <div className="theme-toggle-track">
              <div className="theme-toggle-thumb">
                <span className="theme-icon theme-icon-sun">☀️</span>
                <span className="theme-icon theme-icon-moon">🌙</span>
              </div>
            </div>
          </button>
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
              <i className="fas fa-check"></i> HVCI PASSED
            </span>
            <span className="stat-value">{statsData?.stats?.hvciCompatible || 0}</span>
          </div>
          <div 
            className={`stat-item killer clickable ${activeFilters.has('killer') ? 'active' : ''}`}
            onClick={() => applyDirectFilter('killer')}
          >
            <span className="stat-label">
              <i className="fas fa-skull-crossbones"></i> Killer Drivers
            </span>
            <span className="stat-value">{statsData?.stats?.killerDrivers || 0}</span>
          </div>
        </div>
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
              <i className="fas fa-check"></i> HVCI PASSED
            </button>
            <button 
              className={`filter-btn killer ${pendingFilters.has('killer') ? 'active' : ''}`}
              onClick={() => toggleFilter('killer')}
            >
              <i className="fas fa-skull-crossbones"></i> Killer Drivers
            </button>
            <button 
              className={`filter-btn ${pendingFilters.has('signed') ? 'active' : ''} ${pendingFilters.has('unsigned') ? 'disabled' : ''}`}
              onClick={() => toggleFilter('signed')}
              disabled={pendingFilters.has('unsigned')}
            >
              <i className="fas fa-certificate"></i> Signed Drivers
            </button>
            <button 
              className={`filter-btn ${pendingFilters.has('unsigned') ? 'active' : ''} ${pendingFilters.has('signed') ? 'disabled' : ''}`}
              onClick={() => toggleFilter('unsigned')}
              disabled={pendingFilters.has('signed')}
            >
              <i className="fas fa-exclamation-triangle"></i> Unsigned Drivers
            </button>
            <button 
              className={`filter-btn ${pendingFilters.has('recent') ? 'active' : ''}`}
              onClick={() => toggleFilter('recent')}
            >
              <i className="fas fa-clock"></i> Recent Certificates
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
            <button 
              className="btn btn--primary apply-filters-btn"
              onClick={applyFilters}
              disabled={pendingFilters.size === 0 && activeFilters.size === 0}
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
        
        <div className="search-stats">
          <span>
            {isLoading 
              ? 'Searching...' 
              : `Showing ${Math.min(ITEMS_PER_PAGE, filteredDrivers.length)} of ${totalItems} drivers (Page ${currentPage} of ${totalPages})`
            }
          </span>
          {searchKey && <span className="server-search-indicator"> (Server-side search)</span>}
        </div>
      </div>

      <div className="drivers-grid">        
        {!isLoading && filteredDrivers.length > 0 ? (
          filteredDrivers.map((driver, index) => {
            // Calculer l'index global pour l'unicité
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
            
            <span className="pagination-text">
              Page {currentPage} of {totalPages}
            </span>
            
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
            <div className="contributors">
              <span className="contributors-label">Key Contributors:</span>
              <div className="contributors-list">
                <span className="contributor">Michael Haag</span>
                <span className="contributor">Jose Hernandez</span>
                <span className="contributor">Nasreddine Bencherchali</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-disclaimer">
            This is an independent interface for educational and research purposes.
          </p>
          <div className="footer-links">
            <a 
              href="/terms" 
              className="footer-legal-link"
            >
              <i className="fas fa-gavel"></i> Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
