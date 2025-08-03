export interface Driver {
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
  KnownVulnerableSamples?: KnownVulnerableSample[];
  Signatures?: Signature[];
  Commands?: {
    Command?: string;
    Description?: string;
    OperatingSystem?: string;
    Privileges?: string;
    Usecase?: string;
  };
  Resources?: string[];
  Category?: string;
  Author?: string;
  Created?: string;
  MitreID?: string;
  FileVersion?: string;
  Copyright?: string;
  Tags?: string[];
  CVE?: string[];
  Verified?: string;
  [key: string]: unknown;
}

export interface KnownVulnerableSample {
  MD5?: string;
  SHA1?: string;
  SHA256?: string;
  Filename?: string;
  Imphash?: string;
  CertificateRevoked?: boolean;
  CertificateExpired?: boolean;
  CertificateSuspicious?: boolean;
  CertificateValid?: boolean;
  CertificateStatus?: string;
  [key: string]: unknown;
}

export interface Signature {
  Certificates?: Certificate[];
  [key: string]: unknown;
}

export interface Certificate {
  ValidTo?: string;
  [key: string]: unknown;
}

export interface DriversResponse {
  success: boolean;
  drivers: Driver[];
  total: number;
  hasMore: boolean;
  page?: number;
  query?: string;
  filters?: Record<string, unknown>;
}

export interface Stats {
  total: number;
  hvciCompatible: number;
  killerDrivers: number;
  recentDrivers: number;
  memoryManipulatorDrivers: number;
  processKillerDrivers: number;
  debugBypassDrivers: number;
  registryManipulatorDrivers: number;
  fileManipulatorDrivers: number;
  amd64Drivers: number;
  i386Drivers: number;
  arm64Drivers: number;
  lastUpdated: string;
  hvciBlocklistCheck?: {
    lastCheck: string;
    microsoftLastModified: string;
    totalBlockedHashes: number;
    matchedDrivers: number;
    source: string;
  };
}

export interface StatsResponse {
  success: boolean;
  stats: Stats;
}

export type FilterType = 'hvci' | 'killer' | 'recent' | 'memory-manipulator' | 'process-killer' | 'debug-bypass' | 'registry-manipulator' | 'file-manipulator' | 'architecture';

export interface SearchFilters {
  activeFilters: Set<FilterType>;
  searchQuery: string;
}
