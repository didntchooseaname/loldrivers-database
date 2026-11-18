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
  DisplayName?: string;
  Company?: string;
  Description?: string;
  ImportedFunctions?: string[];
  DownloadUrl?: string;
  FeaturedKiller?: boolean;
  MvdbStatusOverride?: 'passed' | 'blocked' | null;
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
  _vt?: { m: number; s: number; t: number; d: string | null } | null;
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

type MvdbVerdict = 'passed' | 'blocked';

// data/hvci_drivers.csv is produced by the HVCI Drivers Check workflow.
// Hashes missing from it have not been checked yet and must not be reported as blocked.
const loadMvdbVerdicts = (): Map<string, MvdbVerdict> => {
  const verdicts = new Map<string, MvdbVerdict>();
  try {
    const csvPath = path.join(process.cwd(), 'data', 'hvci_drivers.csv');
    const lines = readFileWithEncodingDetection(csvPath).split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const columns = line.split(',').map(col => col.replace(/^"|"$/g, '').trim());
      if (columns.length < 4) continue;
      const verdict: MvdbVerdict | null = columns[3] === 'Allowed' ? 'passed' : columns[3] === 'Blocked' ? 'blocked' : null;
      if (!verdict) continue;
      // MD5, SHA1, SHA256, Status, AuthentihashSHA256 (the last column was added Nov 2026)
      for (const hash of [...columns.slice(0, 3), columns[4]]) {
        if (!hash) continue;
        const key = hash.toLowerCase();
        if (verdicts.get(key) !== 'passed') verdicts.set(key, verdict);
      }
    }
    console.log(`Loaded ${verdicts.size} MVDB verdicts from CSV`);
  } catch (error) {
    console.warn('Could not load HVCI CSV file:', error);
  }
  return verdicts;
};

export interface CatalogSync {
  upstream: { repository: string; commit: string; committed_at: string; message: string };
  synced_at: string;
  samples: number;
}

export interface MvdbSync {
  checked_at: string;
  allowed: number;
  blocked: number;
}

export type VtBucket = 'none' | 'low' | 'medium' | 'high' | 'unscanned';
export const VT_BUCKETS: VtBucket[] = ['none', 'low', 'medium', 'high', 'unscanned'];

interface VtEntry { m?: number; s?: number; t?: number; d?: string | null; f: string; nf?: boolean }

export function vtBucket(vt: { m: number; s: number } | null | undefined): VtBucket {
  if (!vt) return 'unscanned';
  const detections = vt.m + vt.s;
  if (detections === 0) return 'none';
  if (detections <= 5) return 'low';
  if (detections <= 20) return 'medium';
  return 'high';
}

function readJsonFile<T>(file: string): T | null {
  try {
    return JSON.parse(readFileWithEncodingDetection(path.join(process.cwd(), 'data', file))) as T;
  } catch {
    return null;
  }
}

const KILLER_FUNCTIONS_REGEX = /zwterminateprocess/i;

const MANUAL_DRIVERS: ProcessedDriver[] = [
  {
    Id: 'manual-redteamfortress-phantomkiller-bootrepair',
    DisplayName: 'PhantomKiller',
    OriginalFilename: 'BootRepair.sys',
    Filename: 'PhantomKiller.sys',
    Company: 'LENOVO',
    Description: 'PhantomKiller is the newly released, featured process-killer variant based on Lenovo BootRepair.sys. It is tracked separately from the base BootRepair entry: the project ships it as PhantomKiller.sys, while the underlying vulnerable driver lineage is BootRepair.sys from Lenovo PC Manager. The driver exposes \\\\.\\BootRepair without secure DACL restrictions and accepts IOCTL 0x222014 with a 4-byte PID, then calls PsLookupProcessByProcessId, ObOpenObjectByPointer, and ZwTerminateProcess to terminate protected EDR/AV processes.',
    SHA256: '5ab36c116767eaae53a466fbc2dae7cfd608ed77721f65e83312037fbd57c946',
    MachineType: 'AMD64',
    Created: '2018-01-03',
    Author: 'redteamfortress / j3h4ck',
    Category: 'BYOVD Process Killer',
    Tags: ['PhantomKiller', 'PhantomKiller.sys', 'BootRepair.sys', 'Lenovo', 'BYOVD', 'EDR bypass', 'process killer', 'featured killer'],
    ImportedFunctions: ['PsLookupProcessByProcessId', 'ObOpenObjectByPointer', 'ZwTerminateProcess'],
    Commands: {
      Command: 'sc.exe create PhantomKiller binPath="C:\\Path\\to\\PhantomKiller.sys" type=kernel\nsc.exe start PhantomKiller\nPhantomKiller.exe <pid>',
      Description: 'Loads the signed Lenovo driver and uses the PhantomKiller POC to terminate a target process by PID through IOCTL 0x222014.',
      OperatingSystem: 'Windows x64',
      Privileges: 'Driver load requires administrative privileges; an already loaded driver can be abused by a low-privileged user according to the project README.',
      Usecase: 'BYOVD process termination against EDR/AV protected processes.',
    },
    Resources: [
      'https://github.com/redteamfortress/PhantomKiller',
      'https://github.com/redteamfortress/PhantomKiller/releases/tag/v1.0.0',
      'https://github.com/redteamfortress/PhantomKiller/releases/download/v1.0.0/PhantomKiller.zip',
      'https://github.com/redteamfortress/PhantomKiller/raw/refs/heads/main/PhantomKiller.sys',
      'https://medium.com/@jehadbudagga/phantom-killer-reverse-engineering-and-weaponizing-a-lenovo-driver-to-terminate-edr-processes-9191cd06374f',
    ],
    DownloadUrl: 'https://raw.githubusercontent.com/redteamfortress/PhantomKiller/refs/heads/main/PhantomKiller.sys',
    FeaturedKiller: true,
    MvdbStatusOverride: 'passed',
    Signer: 'LENOVO (Symantec Class 3 SHA256 Code Signing CA)',
    BaseDriverName: 'BootRepair.sys',
    SourceDriverName: 'PhantomKiller.sys',
    DeviceObject: '\\\\.\\BootRepair',
    Ioctl: '0x222014',
    VTDetections: '0/71 at time of discovery',
    ReleaseTag: 'v1.0.0',
    ReleaseName: 'Driver & compiled POC',
    ReleasePublishedAt: '2026-05-19T07:04:09Z',
    ReleaseAssetName: 'PhantomKiller.zip',
    ReleaseAssetSha256: 'd05dd3a7b92170b201f314ba27aefa8bda3ca47f33c652b2b4f44545c58205b8',
    DirectDriverDownloadUrl: 'https://raw.githubusercontent.com/redteamfortress/PhantomKiller/refs/heads/main/PhantomKiller.sys',
  },
];

const MANUAL_DRIVERS_CACHE_KEY = MANUAL_DRIVERS
  .map(driver => `${driver.Id || driver.SHA256 || driver.Filename}:${driver.FeaturedKiller ? 'featured' : 'standard'}`)
  .join('|');

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

// Upstream moved PE metadata under KnownVulnerableSamples[].ResearchEvidence (Nov 2026).
const EVIDENCE_FIELDS = [
  'MachineType', 'ImportedFunctions', 'Signatures', 'Company', 'Description', 'Product',
  'ProductVersion', 'FileVersion', 'OriginalFilename', 'Filename', 'InternalName', 'Copyright',
  'Imphash', 'LoadsDespiteHVCI', 'CreationTimestamp', 'Publisher', 'PDBPath',
] as const;

function evidenceFields(evidence: unknown): Record<string, unknown> {
  if (!evidence || typeof evidence !== 'object') return {};
  const source = evidence as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of EVIDENCE_FIELDS) {
    const value = source[key];
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}


class DriversCache {
  private static instance: DriversCache;
  private drivers: ProcessedDriver[] = [];
  private isLoaded = false;
  private fileHash: string = '';
  private indexedData: Map<string, ProcessedDriver[]> = new Map();
  private mvdbVerdicts: Map<string, MvdbVerdict> = new Map();

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
    this.mvdbVerdicts = loadMvdbVerdicts();
    const vtEntries = readJsonFile<{ entries: Record<string, VtEntry> }>('virustotal.json')?.entries ?? {};

    // Compute cert status and MVDB status for every driver once
    for (const driver of this.drivers) {
      driver._certStatus = deriveCertStatus(driver);

      const vt = typeof driver.SHA256 === 'string' ? vtEntries[driver.SHA256.toLowerCase()] : undefined;
      driver._vt = vt && !vt.nf ? { m: vt.m ?? 0, s: vt.s ?? 0, t: vt.t ?? 0, d: vt.d ?? null } : null;

      if (driver.MvdbStatusOverride !== undefined) {
        driver._mvdbStatus = driver.MvdbStatusOverride;
        continue;
      }

      const verdicts = [driver.MD5, driver.SHA1, driver.SHA256, driver.Authentihash?.SHA256]
        .filter((hash): hash is string => typeof hash === 'string' && hash.length > 0)
        .map((hash) => this.mvdbVerdicts.get(hash.toLowerCase()));
      driver._mvdbStatus = verdicts.includes('passed') ? 'passed' : verdicts.includes('blocked') ? 'blocked' : null;
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
    for (const bucket of VT_BUCKETS) {
      this.indexedData.set(`vt-${bucket}`, this.drivers.filter((d) => vtBucket(d._vt as { m: number; s: number } | null) === bucket));
    }

    console.log(`Index: ${trustedCertDrivers.length} valid certs, ${untrustedCertDrivers.length} expired, ${certMissingDrivers.length} no cert, ${recentDrivers.length} recent (12mo)`);
  }

  async loadDrivers(): Promise<ProcessedDriver[]> {
    const dataPath = path.join(process.cwd(), 'data', 'drv.json');
    const currentFileHash = `${this.getFileHash(dataPath)}_${MANUAL_DRIVERS_CACHE_KEY}`;
    const cachedHash = cache.get(CACHE_KEYS.FILE_HASH);
    const cached = cache.get(CACHE_KEYS.ALL_DRIVERS);

    if (cached && this.isLoaded && cachedHash === currentFileHash) {
      return cached as ProcessedDriver[];
    }

    try {
      console.log('Loading drivers from file...');
      const fileContent = readFileWithEncodingDetection(dataPath);
      const rawData: Driver[] = JSON.parse(fileContent);

      const jsonDrivers = rawData
        .filter(item => item && typeof item === 'object')
        .flatMap((driver): ProcessedDriver[] => {
          if (driver.KnownVulnerableSamples && Array.isArray(driver.KnownVulnerableSamples)) {
            return driver.KnownVulnerableSamples.map(sample => {
              const sampleRecord = { ...evidenceFields(sample.ResearchEvidence), ...sample } as Record<string, unknown>;
              delete sampleRecord.ResearchEvidence;

              return {
                ...sampleRecord,
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

      this.drivers = [...MANUAL_DRIVERS, ...jsonDrivers];

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

  async getDriverByKey(key: string): Promise<ProcessedDriver | null> {
    const needle = key.trim().toLowerCase();
    if (!needle) return null;
    const drivers = await this.loadDrivers();
    return drivers.find((d) =>
      [d.SHA256, d.SHA1, d.MD5, d.Id].some((v) => typeof v === 'string' && v.toLowerCase() === needle),
    ) ?? null;
  }

  async getStatistics() {
    const cached = cache.get(CACHE_KEYS.STATS);
    if (cached) return cached;

    const drivers = await this.loadDrivers();

    const hvciCompatibleCount = this.indexedData.get('hvci')?.length || 0;

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
      mvdbBlockedDrivers: drivers.filter(d => d._mvdbStatus === 'blocked').length,
      mvdbUncheckedDrivers: drivers.filter(d => !d._mvdbStatus).length,
      vtBuckets: Object.fromEntries(VT_BUCKETS.map((bucket) => [bucket, this.indexedData.get(`vt-${bucket}`)?.length || 0])),
      certValidDrivers: this.indexedData.get('trustedCert')?.length || 0,
      certExpiredDrivers: this.indexedData.get('untrustedCert')?.length || 0,
      certMissingDrivers: this.indexedData.get('certMissing')?.length || 0,
      catalogSync: readJsonFile<CatalogSync>('sync.json'),
      mvdbSync: readJsonFile<MvdbSync>('mvdb-sync.json'),
    };

    cache.put(CACHE_KEYS.STATS, stats, STATS_CACHE_TTL);
    return stats;
  }

  private applyFiltersOptimized(drivers: ProcessedDriver[], filters: Record<string, unknown>): ProcessedDriver[] {
    let result = drivers;

    for (const [filterType, value] of Object.entries(filters)) {
      if (!value) continue;
      if (filterType === 'newestFirst' || filterType === 'oldestFirst') continue;

      const indexKey = filterType === 'architecture'
        ? (value as string).toLowerCase()
        : filterType === 'vt' ? `vt-${value}` : filterType;
      const indexedResult = this.indexedData.get(indexKey);
      if (indexedResult) {
        const members = new Set(indexedResult);
        result = result.filter(d => members.has(d));
      }
    }

    return result;
  }

  private searchInDriverOptimized(driver: ProcessedDriver, searchTerm: string): boolean {
    const searchFields = [
      driver.DisplayName,
      driver.OriginalFilename,
      driver.Filename,
      driver.Company, driver.Description,
      driver.DisplayName,
      driver.MD5, driver.SHA1, driver.SHA256,
      driver.FileVersion, driver.Copyright,
      driver.Category, driver.Author, driver.MitreID,
      driver.DownloadUrl,
      driver.Signer, driver.DeviceObject, driver.Ioctl,
      driver.VTDetections, driver.ReleaseTag, driver.ReleaseName,
      driver.ReleaseAssetName, driver.ReleaseAssetSha256
    ].filter(Boolean);

    if (driver.Authentihash) {
      searchFields.push(driver.Authentihash.MD5, driver.Authentihash.SHA1, driver.Authentihash.SHA256);
    }
    if (driver.Tags?.length) searchFields.push(...driver.Tags);
    if (driver.CVE?.length) searchFields.push(...driver.CVE);
    if (driver.Resources?.length) searchFields.push(...driver.Resources);

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
