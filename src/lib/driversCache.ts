import cache from 'memory-cache';
import fs from 'fs';
import path from 'path';

// Types
interface Driver {
  Id?: string;
  Tags?: string[];
  Verified?: string;
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
  KnownVulnerableSamples?: any[];
  [key: string]: any;
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
  Signatures?: any[];
}

// Cache keys
const CACHE_KEYS = {
  ALL_DRIVERS: 'all_drivers',
  STATS: 'driver_stats',
  SEARCH_PREFIX: 'search_',
  FILTER_PREFIX: 'filter_',
};

// Cache TTL (en millisecondes)
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600') * 1000; // 1 heure par défaut

class DriversCache {
  private static instance: DriversCache;
  private drivers: ProcessedDriver[] = [];
  private isLoaded = false;

  static getInstance(): DriversCache {
    if (!DriversCache.instance) {
      DriversCache.instance = new DriversCache();
    }
    return DriversCache.instance;
  }

  async loadDrivers(): Promise<ProcessedDriver[]> {
    // Vérifier le cache mémoire d'abord
    const cached = cache.get(CACHE_KEYS.ALL_DRIVERS);
    if (cached && this.isLoaded) {
      return cached;
    }

    try {
      console.log('Loading drivers from file...');
      const dataPath = path.join(process.cwd(), 'data', 'drv.json');
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      const rawData: Driver[] = JSON.parse(fileContent);

      // Traitement des données similaire à l'original
      this.drivers = rawData
        .filter(item => item && typeof item === 'object')
        .flatMap(driver => {
          if (driver.KnownVulnerableSamples && Array.isArray(driver.KnownVulnerableSamples)) {
            return driver.KnownVulnerableSamples.map(sample => ({
              ...sample,
              DriverId: driver.Id,
              Tags: driver.Tags,
              Verified: driver.Verified,
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

      // Mise en cache
      cache.put(CACHE_KEYS.ALL_DRIVERS, this.drivers, CACHE_TTL);
      this.isLoaded = true;

      console.log(`Loaded ${this.drivers.length} drivers`);
      return this.drivers;
    } catch (error) {
      console.error('Error loading drivers:', error);
      throw error;
    }
  }

  async getDrivers(page = 1, limit = 50): Promise<{
    drivers: ProcessedDriver[];
    total: number;
    hasMore: boolean;
  }> {
    const allDrivers = await this.loadDrivers();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      drivers: allDrivers.slice(startIndex, endIndex),
      total: allDrivers.length,
      hasMore: endIndex < allDrivers.length
    };
  }

  async searchDrivers(query: string, filters: any = {}, page = 1, limit = 50) {
    const cacheKey = `${CACHE_KEYS.SEARCH_PREFIX}${query}_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const allDrivers = await this.loadDrivers();
    let filtered = allDrivers;

    // Appliquer les filtres
    if (Object.keys(filters).length > 0) {
      filtered = this.applyFilters(allDrivers, filters);
    }

    // Appliquer la recherche
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      filtered = filtered.filter(driver => this.searchInDriver(driver, searchTerm));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const result = {
      drivers: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      hasMore: endIndex < filtered.length,
      page,
      query,
      filters
    };

    // Cache pour 5 minutes
    cache.put(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  async getStatistics() {
    const cached = cache.get(CACHE_KEYS.STATS);
    if (cached) {
      return cached;
    }

    const drivers = await this.loadDrivers();
    
    const stats = {
      total: drivers.length,
      hvciCompatible: drivers.filter(driver => 
        driver.LoadsDespiteHVCI && 
        driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE'
      ).length,
      killerDrivers: drivers.filter(driver => {
        if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
          return driver.ImportedFunctions.some(func => 
            func.toLowerCase().includes('zwterminateprocess') ||
            func.toLowerCase().includes('zwkillprocess') ||
            func.toLowerCase().includes('ntterminate')
          );
        }
        return false;
      }).length,
      signed: drivers.filter(driver => 
        driver.Signatures && Array.isArray(driver.Signatures) && driver.Signatures.length > 0
      ).length,
      lastUpdated: new Date().toISOString()
    };

    cache.put(CACHE_KEYS.STATS, stats, CACHE_TTL);
    return stats;
  }

  private applyFilters(drivers: ProcessedDriver[], filters: any): ProcessedDriver[] {
    return drivers.filter(driver => {
      for (const [filterType, value] of Object.entries(filters)) {
        if (!value) continue;

        switch (filterType) {
          case 'hvci':
            if (!(driver.LoadsDespiteHVCI && 
                  driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE')) {
              return false;
            }
            break;
          
          case 'killer':
            if (!(driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions) &&
                  driver.ImportedFunctions.some(func => 
                    func.toLowerCase().includes('zwterminateprocess') ||
                    func.toLowerCase().includes('zwkillprocess') ||
                    func.toLowerCase().includes('ntterminate')
                  ))) {
              return false;
            }
            break;
          
          case 'signed':
            if (!(driver.Signatures && Array.isArray(driver.Signatures) && driver.Signatures.length > 0)) {
              return false;
            }
            break;
          
          case 'unsigned':
            if (driver.Signatures && Array.isArray(driver.Signatures) && driver.Signatures.length > 0) {
              return false;
            }
            break;
        }
      }
      return true;
    });
  }

  private searchInDriver(driver: ProcessedDriver, searchTerm: string): boolean {
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

    // Authentihash
    if (driver.Authentihash) {
      basicFields.push(
        driver.Authentihash.MD5,
        driver.Authentihash.SHA1,
        driver.Authentihash.SHA256
      );
    }

    // Tags et CVE
    if (driver.Tags && Array.isArray(driver.Tags)) {
      basicFields.push(...driver.Tags);
    }
    if (driver.CVE && Array.isArray(driver.CVE)) {
      basicFields.push(...driver.CVE);
    }

    // Recherche dans les champs de base
    if (basicFields.some(field => 
      field && field.toString().toLowerCase().includes(searchTerm)
    )) {
      return true;
    }

    // ImportedFunctions
    if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
      if (driver.ImportedFunctions.some(func => 
        func.toLowerCase().includes(searchTerm)
      )) {
        return true;
      }
    }

    // Commands
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
  }

  clearCache() {
    cache.clear();
    this.isLoaded = false;
  }
}

export default DriversCache;
