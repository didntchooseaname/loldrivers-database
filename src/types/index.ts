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
  signed: number;
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

export type FilterType = 'hvci' | 'killer' | 'signed' | 'unsigned' | 'recent';

export interface SearchFilters {
  activeFilters: Set<FilterType>;
  searchQuery: string;
}
