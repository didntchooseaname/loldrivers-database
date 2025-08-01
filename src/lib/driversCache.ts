import cache from 'memory-cache';
import fs from 'fs';
import path from 'path';

// Types
interface Driver {
  Id?: string;
  Tags?: string[];
  Author?: string;
  Created?: string;
  MitreID?: string;
  CVE?: string[];
  Category?: string;
  Commands?: {
    Command?: string;
    Description?: string;
    OperatingSystem?: string;
    Privileges?: string;
    Usecase?: string;
  };
  Resources?: string[];
  KnownVulnerableSamples?: Record<string, unknown>[];
  [key: string]: unknown;
}

interface ProcessedDriver extends Driver {
  OriginalFilename?: string;
  Filename?: string;
  Company?: string;
  Description?: string;
  ImportedFunctions?: string[];
  LoadsDespiteHVCI?: string;
  MD5?: string;
  SHA1?: string;
  SHA256?: string;
  Authentihash?: {
    MD5?: string;
    SHA1?: string;
    SHA256?: string;
  };
  Signatures?: Record<string, unknown>[];
}

// Cache keys
const CACHE_KEYS = {
  ALL_DRIVERS: 'all_drivers',
  STATS: 'driver_stats',
  SEARCH_PREFIX: 'search_',
  FILTER_PREFIX: 'filter_',
  FILE_HASH: 'file_hash',
} as const;

// Cache TTL (in milliseconds) - increased for better performance
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '7200') * 1000; // 2 hours default
const SEARCH_CACHE_TTL = 600000; // 10 minutes pour les recherches
const STATS_CACHE_TTL = 1800000; // 30 minutes pour les stats

// Optimized utility functions
const createSearchKey = (query: string, filters: Record<string, unknown>, page: number, limit: number): string => {
  const filterStr = JSON.stringify(filters);
  return `${CACHE_KEYS.SEARCH_PREFIX}${query}_${filterStr}_${page}_${limit}`;
};

const normalizeString = (str: string): string => str.toLowerCase().trim();

// Pre-compiled regex for better performance
const KILLER_FUNCTIONS_REGEX = /zwterminateprocess/i;

class DriversCache {
  private static instance: DriversCache;
  private drivers: ProcessedDriver[] = [];
  private isLoaded = false;
  private fileHash: string = '';
  private indexedData: Map<string, ProcessedDriver[]> = new Map();

  static getInstance(): DriversCache {
    if (!DriversCache.instance) {
      DriversCache.instance = new DriversCache();
    }
    return DriversCache.instance;
  }

  private getFileHash(filePath: string): string {
    try {
      const stats = fs.statSync(filePath);
      return `${stats.size}_${stats.mtime.getTime()}`;
    } catch {
      return '';
    }
  }

  private buildSearchIndex(): void {
    // Index by filter type for fast access
    const hvciDrivers = this.drivers.filter(driver => 
      driver.LoadsDespiteHVCI?.toString().toUpperCase() === 'TRUE'
    );
    
    const killerDrivers = this.drivers.filter(driver => 
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) && 
      driver.ImportedFunctions.some(func => KILLER_FUNCTIONS_REGEX.test(func))
    );

    const recentDrivers = this.drivers.filter(driver => {
      if (!driver.Created) return false;
      try {
        const createdDate = new Date(driver.Created);
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return createdDate >= sixMonthsAgo;
      } catch {
        return false;
      }
    });

    // New behavioral filters based on imported functions
    const memoryManipulatorDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => {
        const funcLower = func.toLowerCase();
        return funcLower.includes('zwmap') || funcLower.includes('zwallocate') ||
               funcLower.includes('mmmap') || funcLower.includes('mmallocate') ||
               funcLower.includes('virtualalloc') || funcLower.includes('virtualprotect') ||
               funcLower.includes('heap') || funcLower.includes('pool');
      })
    );

    const processKillerDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => {
        const funcLower = func.toLowerCase();
        return funcLower.includes('zwterminateprocess');
      })
    );

    const debugBypassDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => {
        const funcLower = func.toLowerCase();
        return funcLower.includes('zwsetinformationprocess') || funcLower.includes('zwsetinformationthread') ||
               funcLower.includes('zwquerysysteminformation') || funcLower.includes('dbgkd') ||
               funcLower.includes('kddebugger') || funcLower.includes('debugport');
      })
    );

    const registryManipulatorDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => {
        const funcLower = func.toLowerCase();
        return funcLower.includes('zwcreatekey') || funcLower.includes('zwopenkey') ||
               funcLower.includes('zwsetvaluekey') || funcLower.includes('zwdeletekey') ||
               funcLower.includes('regcreate') || funcLower.includes('regopen') ||
               funcLower.includes('regset') || funcLower.includes('regdelete');
      })
    );

    const fileManipulatorDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => {
        const funcLower = func.toLowerCase();
        return funcLower.includes('zwcreatefile') || funcLower.includes('zwopenfile') ||
               funcLower.includes('zwreadfile') || funcLower.includes('zwwritefile') ||
               funcLower.includes('zwdeletefile') || funcLower.includes('iocreate') ||
               funcLower.includes('ntread') || funcLower.includes('ntwrite');
      })
    );

    // Architecture filters
    const amd64Drivers = this.drivers.filter(driver => driver.MachineType === 'AMD64');
    const i386Drivers = this.drivers.filter(driver => driver.MachineType === 'I386');
    const arm64Drivers = this.drivers.filter(driver => driver.MachineType === 'ARM64');

    // Store in index
    this.indexedData.set('hvci', hvciDrivers);
    this.indexedData.set('killer', killerDrivers);
    this.indexedData.set('recent', recentDrivers);
    this.indexedData.set('memoryManipulator', memoryManipulatorDrivers);
    this.indexedData.set('processKiller', processKillerDrivers);
    this.indexedData.set('debugBypass', debugBypassDrivers);
    this.indexedData.set('registryManipulator', registryManipulatorDrivers);
    this.indexedData.set('fileManipulator', fileManipulatorDrivers);
    this.indexedData.set('amd64', amd64Drivers);
    this.indexedData.set('i386', i386Drivers);
    this.indexedData.set('arm64', arm64Drivers);
  }

  async loadDrivers(): Promise<ProcessedDriver[]> {
    const dataPath = path.join(process.cwd(), 'data', 'drv.json');
    const currentFileHash = this.getFileHash(dataPath);
    
    // Check cache with file hash
    const cachedHash = cache.get(CACHE_KEYS.FILE_HASH);
    const cached = cache.get(CACHE_KEYS.ALL_DRIVERS);
    
    if (cached && this.isLoaded && cachedHash === currentFileHash) {
      return cached;
    }

    try {
      console.log('Loading drivers from file...');
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      const rawData: Driver[] = JSON.parse(fileContent);

      // Optimized data processing
      this.drivers = rawData
        .filter(item => item && typeof item === 'object')
        .flatMap(driver => {
          if (driver.KnownVulnerableSamples && Array.isArray(driver.KnownVulnerableSamples)) {
            return driver.KnownVulnerableSamples.map(sample => ({
              ...sample,
              DriverId: driver.Id,
              Tags: driver.Tags,
              Author: driver.Author,
              Created: driver.Created,
              MitreID: driver.MitreID,
              CVE: driver.CVE,
              Category: driver.Category,
              Commands: driver.Commands,
              Resources: driver.Resources
            }));
          }
          return [driver];
        }) as ProcessedDriver[];

      // Construction de l'index de recherche
      this.buildSearchIndex();

      // Optimized caching
      cache.put(CACHE_KEYS.ALL_DRIVERS, this.drivers, CACHE_TTL);
      cache.put(CACHE_KEYS.FILE_HASH, currentFileHash, CACHE_TTL);
      this.isLoaded = true;
      this.fileHash = currentFileHash;

      console.log(`Loaded ${this.drivers.length} drivers with search index`);
      return this.drivers;
    } catch {
      console.error('Error loading drivers');
      throw new Error('Failed to load drivers data');
    }
  }

  async getDrivers(page = 1, limit?: number): Promise<{
    drivers: ProcessedDriver[];
    total: number;
    hasMore: boolean;
  }> {
    const allDrivers = await this.loadDrivers();
    
    // If no limit specified, return all drivers
    if (!limit) {
      return {
        drivers: allDrivers,
        total: allDrivers.length,
        hasMore: false
      };
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      drivers: allDrivers.slice(startIndex, endIndex),
      total: allDrivers.length,
      hasMore: endIndex < allDrivers.length
    };
  }

  async searchDrivers(query: string, filters: Record<string, unknown> = {}, page = 1, limit?: number) {
    const cacheKey = createSearchKey(query, filters, page, limit || 0);
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const allDrivers = await this.loadDrivers();
    let filtered = allDrivers;

    // Optimisation : utiliser l'index pour les filtres
    if (Object.keys(filters).length > 0) {
      filtered = this.applyFiltersOptimized(allDrivers, filters);
    }

    // Optimisation de la recherche
    if (query && query.trim()) {
      const searchTerm = normalizeString(query);
      filtered = filtered.filter(driver => this.searchInDriverOptimized(driver, searchTerm));
    }

    // Sort by date if requested
    if (filters.newestFirst) {
      filtered.sort((a, b) => {
        const dateA = a.Created ? new Date(a.Created).getTime() : 0;
        const dateB = b.Created ? new Date(b.Created).getTime() : 0;
        // Si les deux dates sont invalides, maintenir l'ordre original
        if (dateA === 0 && dateB === 0) return 0;
        // Elements with valid date come first
        if (dateA === 0) return 1;
        if (dateB === 0) return -1;
        return dateB - dateA; // Most recent first
      });
    } else if (filters.oldestFirst) {
      filtered.sort((a, b) => {
        const dateA = a.Created ? new Date(a.Created).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.Created ? new Date(b.Created).getTime() : Number.MAX_SAFE_INTEGER;
        // Si les deux dates sont invalides, maintenir l'ordre original
        if (dateA === Number.MAX_SAFE_INTEGER && dateB === Number.MAX_SAFE_INTEGER) return 0;
        // Elements with valid date come first
        if (dateA === Number.MAX_SAFE_INTEGER) return 1;
        if (dateB === Number.MAX_SAFE_INTEGER) return -1;
        return dateA - dateB; // Plus ancien en premier
      });
    }

    // Pagination - if no limit, return all results
    let result;
    if (!limit) {
      result = {
        drivers: filtered,
        total: filtered.length,
        hasMore: false,
        page,
        query,
        filters
      };
    } else {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      result = {
        drivers: filtered.slice(startIndex, endIndex),
        total: filtered.length,
        hasMore: endIndex < filtered.length,
        page,
        query,
        filters
      };
    }

    // Cache for frequent searches
    cache.put(cacheKey, result, SEARCH_CACHE_TTL);
    return result;
  }

  async getStatistics() {
    const cached = cache.get(CACHE_KEYS.STATS);
    if (cached) {
      return cached;
    }

    const drivers = await this.loadDrivers();
    
    // Read HVCI metadata from file
    let hvciBlocklistCheck;
    try {
      const dataPath = path.join(process.cwd(), 'data', 'drv.json');
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      hvciBlocklistCheck = jsonData._metadata?.hvciBlocklistCheck;
    } catch (error) {
      console.warn('Could not read HVCI blocklist metadata:', error);
    }
    
    // Utilisation de l'index pour des stats plus rapides
    const stats = {
      total: drivers.length,
      hvciCompatible: this.indexedData.get('hvci')?.length || 0,
      killerDrivers: this.indexedData.get('killer')?.length || 0,
      recentDrivers: this.indexedData.get('recent')?.length || 0,
      memoryManipulatorDrivers: this.indexedData.get('memoryManipulator')?.length || 0,
      processKillerDrivers: this.indexedData.get('processKiller')?.length || 0,
      debugBypassDrivers: this.indexedData.get('debugBypass')?.length || 0,
      registryManipulatorDrivers: this.indexedData.get('registryManipulator')?.length || 0,
      fileManipulatorDrivers: this.indexedData.get('fileManipulator')?.length || 0,
      amd64Drivers: this.indexedData.get('amd64')?.length || 0,
      i386Drivers: this.indexedData.get('i386')?.length || 0,
      arm64Drivers: this.indexedData.get('arm64')?.length || 0,
      lastUpdated: new Date().toISOString(),
      ...(hvciBlocklistCheck && { hvciBlocklistCheck })
    };

    // Cache pour les statistiques
    cache.put(CACHE_KEYS.STATS, stats, STATS_CACHE_TTL);
    return stats;
  }

  private applyFiltersOptimized(drivers: ProcessedDriver[], filters: Record<string, unknown>): ProcessedDriver[] {
    let result = drivers;
    
    for (const [filterType, value] of Object.entries(filters)) {
      if (!value) continue;
      
      // Ignorer les filtres de tri
      if (filterType === 'newestFirst' || filterType === 'oldestFirst') {
        continue;
      }
      
      // Special handling for architecture filters
      if (filterType === 'architecture') {
        const archValue = value as string;
        const indexKey = archValue.toLowerCase();
        const indexedResult = this.indexedData.get(indexKey);
        if (indexedResult) {
          result = result.filter(driver => indexedResult.includes(driver));
        }
        continue;
      }
      
      // Use prebuilt index when possible
      const indexedResult = this.indexedData.get(filterType);
      if (indexedResult) {
        // Optimized intersection
        result = result.filter(driver => indexedResult.includes(driver));
      } else {
        // Fallback for non-indexed filters
        result = result.filter(driver => this.applyFilter(driver, filterType));
      }
    }
    
    return result;
  }

  private applyFilter(driver: ProcessedDriver, filterType: string): boolean {
    switch (filterType) {
      case 'recent':
        return this.isRecentDriver(driver);
      case 'trustedCert':
        return this.hasTrustedCertificate(driver);
      case 'untrustedCert':
        return this.hasUntrustedCertificate(driver);
      default:
        return true;
    }
  }

  private isRecentDriver(driver: ProcessedDriver): boolean {
    if (!driver.Created) {
      return false;
    }

    try {
      const createdDate = new Date(driver.Created);
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      // Consider recent if created in the last 6 months
      return createdDate >= sixMonthsAgo;
    } catch {
      return false;
    }
  }

  private hasTrustedCertificate(driver: ProcessedDriver): boolean {
    if (!driver.Signatures || !Array.isArray(driver.Signatures)) {
      return false;
    }

    const trustedIssuers = [
      'Microsoft Corporation',
      'GlobalSign',
      'DigiCert',
      'VeriSign',
      'Symantec',
      'Thawte',
      'GeoTrust',
      'Comodo',
      'Sectigo',
      'Entrust',
      'IdenTrust',
      'Go Daddy',
      'Network Solutions',
      'Starfield Technologies'
    ];

    const now = Date.now();

    for (const signature of driver.Signatures) {
      if (signature.Certificates && Array.isArray(signature.Certificates)) {
        for (const cert of signature.Certificates) {
          if (cert.Subject && cert.ValidTo) {
            try {
              const validTo = new Date(cert.ValidTo).getTime();
              if (validTo > now) {
                const isTrusted = trustedIssuers.some(issuer => 
                  typeof cert.Subject === 'string' && cert.Subject.includes(issuer)
                );
                if (isTrusted) {
                  return true;
                }
              }
            } catch {
              continue;
            }
          }
        }
      }
    }
    return false;
  }

  private hasUntrustedCertificate(driver: ProcessedDriver): boolean {
    if (!driver.Signatures || !Array.isArray(driver.Signatures)) {
      return false;
    }

    let hasAnyCertificate = false;

    for (const signature of driver.Signatures) {
      if (signature.Certificates && Array.isArray(signature.Certificates)) {
        for (const cert of signature.Certificates) {
          if (cert.Subject) {
            hasAnyCertificate = true;
            break;
          }
        }
      }
    }

    // Retourner true si le driver a des certificats mais aucun n'est de confiance
    return hasAnyCertificate && !this.hasTrustedCertificate(driver);
  }

  private searchInDriverOptimized(driver: ProcessedDriver, searchTerm: string): boolean {
    // Pre-compile search fields to avoid repetition
    const searchFields = [
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
      driver.MitreID
    ].filter(Boolean);

    // Authentihash
    if (driver.Authentihash) {
      searchFields.push(
        driver.Authentihash.MD5,
        driver.Authentihash.SHA1,
        driver.Authentihash.SHA256
      );
    }

    // Tags et CVE
    if (driver.Tags?.length) {
      searchFields.push(...driver.Tags);
    }
    if (driver.CVE?.length) {
      searchFields.push(...driver.CVE);
    }

    // Optimized search in base fields
    const hasBasicMatch = searchFields.some(field => 
      field && normalizeString(field.toString()).includes(searchTerm)
    );
    
    if (hasBasicMatch) return true;

    // ImportedFunctions with optimized regex
    if (driver.ImportedFunctions?.length) {
      const hasImportMatch = driver.ImportedFunctions.some(func => 
        normalizeString(func).includes(searchTerm)
      );
      if (hasImportMatch) return true;
    }

    // Commands
    if (driver.Commands) {
      const commandFields = [
        driver.Commands.Command,
        driver.Commands.Description,
        driver.Commands.OperatingSystem,
        driver.Commands.Privileges,
        driver.Commands.Usecase
      ].filter(Boolean);
      
      const hasCommandMatch = commandFields.some(field => 
        field && normalizeString(field.toString()).includes(searchTerm)
      );
      if (hasCommandMatch) return true;
    }

    return false;
  }

  clearCache() {
    cache.clear();
    this.isLoaded = false;
  }
}

export default DriversCache;
