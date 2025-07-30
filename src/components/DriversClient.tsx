'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [activeFilters, setActiveFilters] = useState(new Set<string>());
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>(initialDrivers.drivers);
  const [expandedSections, setExpandedSections] = useState(new Set<string>());

  // Utilisation de SWR pour le cache côté client
  const { data: driversData } = useSWR<DriversResponse>(
    `/api/drivers?limit=10000`, // Charger tous les drivers pour filtrage côté client
    fetcher,
    {
      fallbackData: initialDrivers,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const { data: statsData } = useSWR<{ success: boolean; stats: Stats }>(
    '/api/stats',
    fetcher,
    {
      fallbackData: initialStats,
      revalidateOnFocus: false,
      refreshInterval: 300000,
    }
  );

  // Filtrage combiné (identique à l'original)
  const applyCombinedFilters = useCallback(() => {
    if (!driversData?.drivers) return;

    let filtered = [...driversData.drivers];

    // Appliquer les filtres actifs
    if (activeFilters.size > 0) {
      filtered = filtered.filter(driver => {
        return Array.from(activeFilters).every(filterType => {
          switch (filterType) {
            case 'hvci':
              return driver.LoadsDespiteHVCI && 
                     driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE';
            
            case 'killer':
              if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
                return driver.ImportedFunctions.some(func => 
                  func.toLowerCase().includes('zwterminateprocess') ||
                  func.toLowerCase().includes('zwkillprocess') ||
                  func.toLowerCase().includes('ntterminate')
                );
              }
              return false;
            
            case 'signed':
              return driver.Signatures && Array.isArray(driver.Signatures) && driver.Signatures.length > 0;
            
            case 'unsigned':
              return !driver.Signatures || !Array.isArray(driver.Signatures) || driver.Signatures.length === 0;
            
            case 'recent':
              return hasActiveCertificate(driver);
            
            default:
              return true;
          }
        });
      });
    }

    // Appliquer la recherche
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(driver => searchInDriver(driver, searchTerm));
    }

    setFilteredDrivers(filtered);
  }, [driversData?.drivers, activeFilters, searchQuery]);

  // Fonction de recherche (identique à l'original)
  const searchInDriver = (driver: Driver, searchTerm: string): boolean => {
    const basicFields = [
      driver.OriginalFilename || driver.Filename,
      driver.Company,
      driver.Description,
      driver.MD5,
      driver.SHA1,
      driver.SHA256,
      driver.FileVersion,
      driver.Copyright,
      driver.Category,
      driver.Author,
      driver.MitreID,
      driver.Verified
    ];

    if (driver.Authentihash) {
      basicFields.push(
        driver.Authentihash.MD5,
        driver.Authentihash.SHA1,
        driver.Authentihash.SHA256
      );
    }

    if (driver.Tags && Array.isArray(driver.Tags)) {
      basicFields.push(...driver.Tags);
    }
    if (driver.CVE && Array.isArray(driver.CVE)) {
      basicFields.push(...driver.CVE);
    }

    if (basicFields.some(field => 
      field && field.toString().toLowerCase().includes(searchTerm)
    )) {
      return true;
    }

    if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
      if (driver.ImportedFunctions.some(func => 
        func.toLowerCase().includes(searchTerm)
      )) {
        return true;
      }
    }

    if (driver.LoadsDespiteHVCI && 
        driver.LoadsDespiteHVCI.toLowerCase().includes(searchTerm)) {
      return true;
    }

    if (driver.Commands) {
      const commandFields = [
        driver.Commands.Command,
        driver.Commands.Description,
        driver.Commands.OperatingSystem,
        driver.Commands.Privileges,
        driver.Commands.Usecase
      ];
      if (commandFields.some(field => 
        field && field.toString().toLowerCase().includes(searchTerm)
      )) {
        return true;
      }
    }

    return false;
  };

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
            } catch (error) {
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
    setSearchQuery('');
    
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterType)) {
        newFilters.delete(filterType);
      } else {
        newFilters.add(filterType);
      }
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilters(new Set());
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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

  // Appliquer les filtres quand les dépendances changent
  useEffect(() => {
    applyCombinedFilters();
  }, [applyCombinedFilters]);

  // Générer les hash tags
  const renderHashTags = (hashes: any) => {
    return (
      <div className="hash-tags">
        {hashes.MD5 && <span className="hash-tag md5">MD5: {hashes.MD5}</span>}
        {hashes.SHA1 && <span className="hash-tag sha1">SHA1: {hashes.SHA1}</span>}
        {hashes.SHA256 && <span className="hash-tag sha256">SHA256: {hashes.SHA256}</span>}
        {!hashes.MD5 && !hashes.SHA1 && !hashes.SHA256 && (
          <span className="hash-tag">No hashes available</span>
        )}
      </div>
    );
  };

  // Générer les status tags
  const generateStatusTags = (driver: Driver) => {
    const tags = [];
    
    if (driver.LoadsDespiteHVCI) {
      const isTrue = driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE';
      tags.push({
        text: `HVCI: ${driver.LoadsDespiteHVCI}`,
        type: isTrue ? 'success' : 'danger'
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
          type: 'danger'
        });
      }
    }
    
    if (hasActiveCertificate(driver)) {
      tags.push({
        text: 'ACTIVE CERTIFICATE',
        type: 'success'
      });
    }
    
    return tags;
  };

  const renderStatusTags = (tags: any[]) => {
    if (!tags.length) return null;
    
    return (
      <div className="status-tags">
        {tags.map((tag, index) => (
          <span key={index} className={`status-tag ${tag.type}`}>
            {tag.text}
          </span>
        ))}
      </div>
    );
  };

  // Section collapsible
  const renderCollapsibleSection = (title: string, content: string, driver: Driver, index: number) => {
    if (!content) return null;
    
    const sectionId = `section-${index}-${title.replace(/\s+/g, '-').toLowerCase()}`;
    const isExpanded = expandedSections.has(sectionId);
    
    return (
      <div className={`collapsible-section ${isExpanded ? 'expanded' : ''}`} key={sectionId}>
        <div className="collapsible-header" onClick={() => toggleSection(sectionId)}>
          <span className="collapsible-title">{title}</span>
          <span className="collapsible-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className="collapsible-content">
            <div className="collapsible-inner">
              <div className="field-content">{content}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Section des fonctions importées
  const renderImportedFunctionsSection = (functions: string[] | undefined, driver: Driver, index: number) => {
    const sectionId = `functions-${index}`;
    const isExpanded = expandedSections.has(sectionId);
    
    return (
      <div className={`collapsible-section ${isExpanded ? 'expanded' : ''}`} key={sectionId}>
        <div className="collapsible-header" onClick={() => toggleSection(sectionId)}>
          <span className="collapsible-title">
            Imported Functions ({functions?.length || 0})
          </span>
          <span className="collapsible-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className="collapsible-content">
            <div className="collapsible-inner">
              {functions && functions.length > 0 ? (
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
              ) : (
                <div className="field-content">No imported functions available</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Section des commandes
  const renderCommandsSection = (commands: any, driver: Driver, index: number) => {
    if (!commands || typeof commands !== 'object') return null;
    
    const sectionId = `commands-${index}`;
    const isExpanded = expandedSections.has(sectionId);
    
    return (
      <div className={`collapsible-section ${isExpanded ? 'expanded' : ''}`} key={sectionId}>
        <div className="collapsible-header" onClick={() => toggleSection(sectionId)}>
          <span className="collapsible-title">Commands & Usage</span>
          <span className="collapsible-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className="collapsible-content">
            <div className="collapsible-inner">
              {commands.Description && (
                <div className="command-field">
                  <strong>Description:</strong> {commands.Description}
                </div>
              )}
              {commands.OperatingSystem && (
                <div className="command-field">
                  <strong>OS:</strong> {commands.OperatingSystem}
                </div>
              )}
              {commands.Privileges && (
                <div className="command-field">
                  <strong>Privileges:</strong> {commands.Privileges}
                </div>
              )}
              {commands.Usecase && (
                <div className="command-field">
                  <strong>Use case:</strong> {commands.Usecase}
                </div>
              )}
              {commands.Command && commands.Command.trim() && (
                <div className="command-field">
                  <strong>Command:</strong> <code>{commands.Command}</code>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <h3 className="driver-title">{filename}</h3>
          {renderHashTags(hashes)}
          {renderStatusTags(statusTags)}
        </div>
        
        {renderCollapsibleSection('Company', driver.Company || 'Unknown', driver, index)}
        {renderCollapsibleSection('Description', driver.Description || 'No description available', driver, index)}
        {driver.Category && renderCollapsibleSection('Category', driver.Category, driver, index)}
        {driver.Author && renderCollapsibleSection('Author', driver.Author, driver, index)}
        {driver.MitreID && renderCollapsibleSection('MITRE ID', driver.MitreID, driver, index)}
        {renderCommandsSection(driver.Commands, driver, index)}
        {renderImportedFunctionsSection(driver.ImportedFunctions, driver, index)}
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
            <span className="stat-label">Total Drivers</span>
            <span className="stat-value">{statsData?.stats?.total || 0}</span>
          </div>
          <div 
            className={`stat-item clickable hvci-item ${activeFilters.has('hvci') ? 'active' : ''}`}
            onClick={() => toggleFilter('hvci')}
          >
            <span className="stat-label">HVCI Compatible</span>
            <span className="stat-value">{statsData?.stats?.hvciCompatible || 0}</span>
          </div>
          <div 
            className={`stat-item killer clickable ${activeFilters.has('killer') ? 'active' : ''}`}
            onClick={() => toggleFilter('killer')}
          >
            <span className="stat-label">Killer Drivers</span>
            <span className="stat-value">{statsData?.stats?.killerDrivers || 0}</span>
          </div>
        </div>
      </header>

      <div className="search-section">
        <div className="search-container">
          <input 
            type="text" 
            className="form-control search-input" 
            placeholder="Search drivers by name, hash, company, description..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <button 
            className="btn btn--outline btn--sm"
            onClick={clearAllFilters}
          >
            Clear
          </button>
        </div>
        
        <div className="filter-options">
          <div className="filter-group">
            <span className="filter-label">Quick Filters:</span>
            <button 
              className={`filter-btn hvci-filter ${activeFilters.has('hvci') ? 'active' : ''}`}
              onClick={() => toggleFilter('hvci')}
            >
              HVCI Compatible
            </button>
            <button 
              className={`filter-btn killer ${activeFilters.has('killer') ? 'active' : ''}`}
              onClick={() => toggleFilter('killer')}
            >
              Killer Drivers
            </button>
            <button 
              className={`filter-btn ${activeFilters.has('signed') ? 'active' : ''}`}
              onClick={() => toggleFilter('signed')}
            >
              Signed Drivers
            </button>
            <button 
              className={`filter-btn ${activeFilters.has('unsigned') ? 'active' : ''}`}
              onClick={() => toggleFilter('unsigned')}
            >
              Unsigned Drivers
            </button>
            <button 
              className={`filter-btn ${activeFilters.has('recent') ? 'active' : ''}`}
              onClick={() => toggleFilter('recent')}
            >
              Recent Certificates
            </button>
            <button 
              className="filter-btn clear"
              onClick={clearAllFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        <div className="search-stats">
          <span>{filteredDrivers.length}</span> drivers found
        </div>
      </div>

      <div className="drivers-grid">
        {filteredDrivers.length > 0 ? (
          filteredDrivers.map((driver, index) => createDriverCard(driver, index))
        ) : (
          <div className="empty-state">
            <h3>No drivers found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
