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

interface Certificate {
  ValidFrom?: string;
  ValidTo?: string;
  Subject?: string;
  [key: string]: unknown;
}

interface SignatureEntry {
  Certificates?: Certificate[];
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
  MachineType?: string;
  Authentihash?: {
    MD5?: string;
    SHA1?: string;
    SHA256?: string;
  };
  Signatures?: SignatureEntry[];
  // Computed at index time
  _certStatus?: 'valid' | 'expired' | 'none';
  _mvdbStatus?: 'passed' | 'blocked' | null;
}

// Simple LRU-ish cache
class SimpleCache {
  private store = new Map<string, { data: unknown; expires: number }>();
  private maxSize: number;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  get(key: string): unknown | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  put(key: string, data: unknown, ttl: number): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, { data, expires: Date.now() + ttl });
  }

  clear(): void {
    this.store.clear();
  }
}

const cache = new SimpleCache(200);

const CACHE_KEYS = {
  ALL_DRIVERS: 'all_drivers',
  STATS: 'driver_stats',
  SEARCH_PREFIX: 'search_',
  FILE_HASH: 'file_hash',
} as const;

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '7200') * 1000;
const SEARCH_CACHE_TTL = 600000;
const STATS_CACHE_TTL = 1800000;

const createSearchKey = (query: string, filters: Record<string, unknown>, page: number, limit: number): string => {
  const filterStr = JSON.stringify(filters);
  return `${CACHE_KEYS.SEARCH_PREFIX}${query}_${filterStr}_${page}_${limit}`;
};

const normalizeString = (str: string): string => str.toLowerCase().trim();

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const normalized = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return normalized.length > 0 ? normalized : undefined;
};

const readFileWithEncodingDetection = (filePath: string): string => {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return buffer.toString('utf8').slice(1);
  } else if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return buffer.toString('utf16le').slice(1);
  } else if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return buffer.toString('utf16le').slice(1);
  }
  return buffer.toString('utf8');
};

const loadHVCIAllowedHashes = (): Set<string> => {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'hvci_drivers.csv');
    const csvContent = readFileWithEncodingDetection(csvPath);
    const lines = csvContent.split('\n');
    const allowedHashes = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const columns = line.split(',').map(col => col.replace(/^"|"$/g, '').trim());
      if (columns.length >= 4 && columns[3] === 'Allowed') {
        if (columns[0]) allowedHashes.add(columns[0].toLowerCase());
        if (columns[1]) allowedHashes.add(columns[1].toLowerCase());
        if (columns[2]) allowedHashes.add(columns[2].toLowerCase());
      }
    }
    console.log(`Loaded ${allowedHashes.size} HVCI allowed hashes from CSV`);
    return allowedHashes;
  } catch (error) {
    console.warn('Could not load HVCI CSV file:', error);
    return new Set();
  }
};

const KILLER_FUNCTIONS_REGEX = /zwterminateprocess/i;

/**
 * Derive certificate status from the Signatures[].Certificates[].ValidTo dates.
 * 'valid'   = at least one certificate with ValidTo in the future
 * 'expired' = has certificates, but ALL are expired
 * 'none'    = no Signatures or no Certificates at all
 */
function deriveCertStatus(driver: ProcessedDriver): 'valid' | 'expired' | 'none' {
  if (!driver.Signatures || !Array.isArray(driver.Signatures) || driver.Signatures.length === 0) {
    return 'none';
  }

  const now = new Date();
  let hasCerts = false;
  let hasValidCert = false;

  for (const sig of driver.Signatures) {
    if (!sig.Certificates || !Array.isArray(sig.Certificates)) continue;
    for (const cert of sig.Certificates) {
      hasCerts = true;
      if (cert.ValidTo) {
        const validTo = new Date(cert.ValidTo);
        if (validTo > now) {
          hasValidCert = true;
        }
      }
    }
  }

  if (!hasCerts) return 'none';
  return hasValidCert ? 'valid' : 'expired';
}

class DriversCache {
  private static instance: DriversCache;
  private drivers: ProcessedDriver[] = [];
  private isLoaded = false;
  private fileHash: string = '';
  private indexedData: Map<string, ProcessedDriver[]> = new Map();
  private hvciAllowedHashes: Set<string> = new Set();

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
    this.hvciAllowedHashes = loadHVCIAllowedHashes();

    // Compute cert status and MVDB status for every driver once
    for (const driver of this.drivers) {
      driver._certStatus = deriveCertStatus(driver);

      // MVDB status: check if driver hash is in the HVCI allowed CSV
      const hashInCsv = (driver.MD5 && this.hvciAllowedHashes.has(driver.MD5.toLowerCase())) ||
                         (driver.SHA1 && this.hvciAllowedHashes.has(driver.SHA1.toLowerCase())) ||
                         (driver.SHA256 && this.hvciAllowedHashes.has(driver.SHA256.toLowerCase()));
      if (hashInCsv) {
        driver._mvdbStatus = 'passed';
      } else if (driver.MD5 || driver.SHA1 || driver.SHA256) {
        driver._mvdbStatus = 'blocked';
      } else {
        driver._mvdbStatus = null;
      }
    }

    // HVCI/MVDB: use the precomputed status
    const hvciDrivers = this.drivers.filter(d => d._mvdbStatus === 'passed');

    const killerDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => KILLER_FUNCTIONS_REGEX.test(func))
    );

    // Recent: last 12 months (6 months was too narrow for this dataset)
    const recentDrivers = this.drivers.filter(driver => {
      if (!driver.Created) return false;
      try {
        const createdDate = new Date(driver.Created);
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 12);
        return createdDate >= cutoff;
      } catch {
        return false;
      }
    });

    // Behavioral filters
    const memoryManipulatorDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => {
        const f = func.toLowerCase();
        return f.includes('zwmap') || f.includes('zwallocate') ||
               f.includes('mmmap') || f.includes('mmallocate') ||
               f.includes('virtualalloc') || f.includes('virtualprotect') ||
               f.includes('heap') || f.includes('pool');
      })
    );

    const processKillerDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => func.toLowerCase().includes('zwterminateprocess'))
    );

    const debugBypassDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => {
        const f = func.toLowerCase();
        return f.includes('zwsetinformationprocess') || f.includes('zwsetinformationthread') ||
               f.includes('zwquerysysteminformation') || f.includes('dbgkd') ||
               f.includes('kddebugger') || f.includes('debugport');
      })
    );

    const registryManipulatorDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => {
        const f = func.toLowerCase();
        return f.includes('zwcreatekey') || f.includes('zwopenkey') ||
               f.includes('zwsetvaluekey') || f.includes('zwdeletekey') ||
               f.includes('regcreate') || f.includes('regopen') ||
               f.includes('regset') || f.includes('regdelete');
      })
    );

    const fileManipulatorDrivers = this.drivers.filter(driver =>
      driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
      driver.ImportedFunctions.some(func => {
        const f = func.toLowerCase();
        return f.includes('zwcreatefile') || f.includes('zwopenfile') ||
               f.includes('zwreadfile') || f.includes('zwwritefile') ||
               f.includes('zwdeletefile') || f.includes('iocreate') ||
               f.includes('ntread') || f.includes('ntwrite');
      })
    );

    // Certificate filters derived from actual cert dates
    const trustedCertDrivers = this.drivers.filter(d => d._certStatus === 'valid');
    const untrustedCertDrivers = this.drivers.filter(d => d._certStatus === 'expired');
    const certValidDrivers = trustedCertDrivers;
    const certExpiredDrivers = untrustedCertDrivers;
    const certMissingDrivers = this.drivers.filter(d => d._certStatus === 'none');

    // Architecture
    const amd64Drivers = this.drivers.filter(d => d.MachineType === 'AMD64');
    const i386Drivers = this.drivers.filter(d => d.MachineType === 'I386');
    const arm64Drivers = this.drivers.filter(d => d.MachineType === 'ARM64');

    this.indexedData.set('hvci', hvciDrivers);
    this.indexedData.set('killer', killerDrivers);
    this.indexedData.set('recent', recentDrivers);
    this.indexedData.set('memoryManipulator', memoryManipulatorDrivers);
    this.indexedData.set('processKiller', processKillerDrivers);
    this.indexedData.set('debugBypass', debugBypassDrivers);
    this.indexedData.set('registryManipulator', registryManipulatorDrivers);
    this.indexedData.set('fileManipulator', fileManipulatorDrivers);
    this.indexedData.set('trustedCert', trustedCertDrivers);
    this.indexedData.set('untrustedCert', untrustedCertDrivers);
    this.indexedData.set('certValid', certValidDrivers);
    this.indexedData.set('certExpired', certExpiredDrivers);
    this.indexedData.set('certMissing', certMissingDrivers);
    // certRevoked / certSuspicious not derivable from date alone; alias to expired
    this.indexedData.set('certRevoked', untrustedCertDrivers);
    this.indexedData.set('certSuspicious', untrustedCertDrivers);
    this.indexedData.set('amd64', amd64Drivers);
    this.indexedData.set('i386', i386Drivers);
    this.indexedData.set('arm64', arm64Drivers);

    console.log(`Index: ${trustedCertDrivers.length} valid certs, ${untrustedCertDrivers.length} expired, ${certMissingDrivers.length} no cert, ${recentDrivers.length} recent (12mo)`);
  }

  async loadDrivers(): Promise<ProcessedDriver[]> {
    const dataPath = path.join(process.cwd(), 'data', 'drv.json');
    const currentFileHash = this.getFileHash(dataPath);
    const cachedHash = cache.get(CACHE_KEYS.FILE_HASH);
    const cached = cache.get(CACHE_KEYS.ALL_DRIVERS);

    if (cached && this.isLoaded && cachedHash === currentFileHash) {
      return cached as ProcessedDriver[];
    }

    try {
      console.log('Loading drivers from file...');
      const fileContent = readFileWithEncodingDetection(dataPath);
      const rawData: Driver[] = JSON.parse(fileContent);

      this.drivers = rawData
        .filter(item => item && typeof item === 'object')
        .flatMap((driver): ProcessedDriver[] => {
          if (driver.KnownVulnerableSamples && Array.isArray(driver.KnownVulnerableSamples)) {
            return driver.KnownVulnerableSamples.map(sample => {
              const sampleRecord = sample as Record<string, unknown>;

              return {
                ...sample,
                DriverId: driver.Id,
                Tags: driver.Tags,
                Author: driver.Author,
                Created: driver.Created,
                MitreID: driver.MitreID,
                CVE: driver.CVE,
                Category: driver.Category,
                Commands: driver.Commands,
                Resources: driver.Resources,
                ImportedFunctions: normalizeStringArray(sampleRecord.ImportedFunctions),
              };
            });
          }
          return [{
            ...driver,
            ImportedFunctions: normalizeStringArray(driver.ImportedFunctions),
          }];
        }) as ProcessedDriver[];

      this.buildSearchIndex();

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
    if (!limit) {
      return { drivers: allDrivers, total: allDrivers.length, hasMore: false };
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
    if (cached) return cached;

    const allDrivers = await this.loadDrivers();
    let filtered = allDrivers;

    if (Object.keys(filters).length > 0) {
      filtered = this.applyFiltersOptimized(allDrivers, filters);
    }

    if (query && query.trim()) {
      const searchTerm = normalizeString(query);
      filtered = filtered.filter(driver => this.searchInDriverOptimized(driver, searchTerm));
    }

    if (filters.newestFirst) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.Created ? new Date(a.Created).getTime() : 0;
        const dateB = b.Created ? new Date(b.Created).getTime() : 0;
        if (dateA === 0 && dateB === 0) return 0;
        if (dateA === 0) return 1;
        if (dateB === 0) return -1;
        return dateB - dateA;
      });
    } else if (filters.oldestFirst) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.Created ? new Date(a.Created).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.Created ? new Date(b.Created).getTime() : Number.MAX_SAFE_INTEGER;
        if (dateA === Number.MAX_SAFE_INTEGER && dateB === Number.MAX_SAFE_INTEGER) return 0;
        if (dateA === Number.MAX_SAFE_INTEGER) return 1;
        if (dateB === Number.MAX_SAFE_INTEGER) return -1;
        return dateA - dateB;
      });
    }

    let result;
    if (!limit) {
      result = { drivers: filtered, total: filtered.length, hasMore: false, page, query, filters };
    } else {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      result = {
        drivers: filtered.slice(startIndex, endIndex),
        total: filtered.length,
        hasMore: endIndex < filtered.length,
        page, query, filters
      };
    }

    cache.put(cacheKey, result, SEARCH_CACHE_TTL);
    return result;
  }

  async getStatistics() {
    const cached = cache.get(CACHE_KEYS.STATS);
    if (cached) return cached;

    const drivers = await this.loadDrivers();

    let hvciBlocklistCheck;
    try {
      const dataPath = path.join(process.cwd(), 'data', 'drv.json');
      const fileContent = readFileWithEncodingDetection(dataPath);
      const jsonData = JSON.parse(fileContent);
      hvciBlocklistCheck = jsonData._metadata?.hvciBlocklistCheck;
    } catch (error) {
      console.warn('Could not read HVCI blocklist metadata:', error);
    }

    let hvciCompatibleCount = 0;
    try {
      const csvPath = path.join(process.cwd(), 'data', 'hvci_drivers.csv');
      const csvContent = readFileWithEncodingDetection(csvPath);
      const lines = csvContent.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split(',').map(col => col.replace(/^"|"$/g, '').trim());
        if (columns.length >= 4 && columns[3] === 'Allowed') {
          hvciCompatibleCount++;
        }
      }
    } catch (error) {
      console.warn('Could not read HVCI CSV for stats:', error);
      hvciCompatibleCount = this.indexedData.get('hvci')?.length || 0;
    }

    const stats = {
      total: drivers.length,
      hvciCompatible: hvciCompatibleCount,
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

    cache.put(CACHE_KEYS.STATS, stats, STATS_CACHE_TTL);
    return stats;
  }

  private applyFiltersOptimized(drivers: ProcessedDriver[], filters: Record<string, unknown>): ProcessedDriver[] {
    let result = drivers;

    for (const [filterType, value] of Object.entries(filters)) {
      if (!value) continue;
      if (filterType === 'newestFirst' || filterType === 'oldestFirst') continue;

      if (filterType === 'architecture') {
        const indexKey = (value as string).toLowerCase();
        const indexedResult = this.indexedData.get(indexKey);
        if (indexedResult) {
          result = result.filter(d => indexedResult.includes(d));
        }
        continue;
      }

      const indexedResult = this.indexedData.get(filterType);
      if (indexedResult) {
        result = result.filter(d => indexedResult.includes(d));
      }
    }

    return result;
  }

  private searchInDriverOptimized(driver: ProcessedDriver, searchTerm: string): boolean {
    const searchFields = [
      driver.OriginalFilename || driver.Filename,
      driver.Company, driver.Description,
      driver.MD5, driver.SHA1, driver.SHA256,
      driver.FileVersion, driver.Copyright,
      driver.Category, driver.Author, driver.MitreID
    ].filter(Boolean);

    if (driver.Authentihash) {
      searchFields.push(driver.Authentihash.MD5, driver.Authentihash.SHA1, driver.Authentihash.SHA256);
    }
    if (driver.Tags?.length) searchFields.push(...driver.Tags);
    if (driver.CVE?.length) searchFields.push(...driver.CVE);

    if (searchFields.some(field => field && normalizeString(field.toString()).includes(searchTerm))) return true;

    if (Array.isArray(driver.ImportedFunctions) && driver.ImportedFunctions.length > 0) {
      if (driver.ImportedFunctions.some(func => normalizeString(func).includes(searchTerm))) return true;
    }

    if (driver.Commands) {
      const cmdFields = [
        driver.Commands.Command, driver.Commands.Description,
        driver.Commands.OperatingSystem, driver.Commands.Privileges, driver.Commands.Usecase
      ].filter(Boolean);
      if (cmdFields.some(f => f && normalizeString(f.toString()).includes(searchTerm))) return true;
    }

    return false;
  }

  clearCache() {
    cache.clear();
    this.isLoaded = false;
  }
}

export default DriversCache;
