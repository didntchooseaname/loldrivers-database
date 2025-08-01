// Application configuration
export const APP_CONFIG = {
  // Cache durations
  CACHE_TTL: 3600,
  EXTENDED_CACHE_TTL: 7200,
  CLIENT_CACHE_TIME: 300000,
  STATS_REFRESH_INTERVAL: 600000,
  SEARCH_CACHE_TTL: 300000,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
  VIRTUAL_LIST_ITEM_HEIGHT: 120,
  VIRTUAL_LIST_BUFFER: 5,
  
  // Search performance
  SEARCH_DEBOUNCE_DELAY: 300,
  SEARCH_MIN_LENGTH: 2,
  THROTTLE_DELAY: 100,
  
  // API endpoints
  API_ENDPOINTS: {
    DRIVERS: '/api/drivers',
    STATS: '/api/stats'
  },
  
  // Performance monitoring
  PERFORMANCE_MARK: {
    SEARCH_START: 'search-start',
    SEARCH_END: 'search-end',
    RENDER_START: 'render-start',
    RENDER_END: 'render-end'
  }
} as const;

export const FILTER_TYPES = {
  HVCI: 'hvci',
  KILLER: 'killer', 
  SIGNED: 'signed',
  UNSIGNED: 'unsigned',
  RECENT: 'recent'
} as const;

// Pre-compiled regex for performance
export const KILLER_FUNCTIONS_REGEX = /zwterminateprocess|zwkillprocess|ntterminate/i;

export const KILLER_FUNCTIONS = [
  'zwterminateprocess',
  'zwkillprocess', 
  'ntterminate'
] as const;

export const NORMALIZATION_OPTIONS = {
  removeAccents: true,
  toLowerCase: true,
  trimWhitespace: true
} as const;

export const THEME_ATTRIBUTE = 'data-color-scheme';
export const THEME_STORAGE_KEY = 'theme';

export const DEFAULT_STATS = {
  total: 0,
  hvciCompatible: 0,
  killerDrivers: 0,
  signed: 0,
  lastUpdated: new Date().toISOString()
} as const;

// Cache configuration for different data types
export const CACHE_KEYS = {
  ALL_DRIVERS: 'drivers:all',
  SEARCH_PREFIX: 'search:',
  STATS: 'stats:main',
  FILE_HASH: 'file:hash',
  INDEX: 'search:index'
} as const;

// Optimized cache headers
export const CACHE_HEADERS = {
  STATIC_ASSETS: 'public, max-age=31536000, immutable',
  API_SHORT: 'public, max-age=300, stale-while-revalidate=3600',
  API_LONG: 'public, max-age=3600, stale-while-revalidate=86400',
  NO_CACHE: 'no-cache, no-store, must-revalidate'
} as const;
