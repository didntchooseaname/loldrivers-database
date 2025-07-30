export const APP_CONFIG = {
  // Cache configuration
  CACHE_TTL: 3600, // 1 hour in seconds
  CLIENT_CACHE_TIME: 60000, // 1 minute in milliseconds
  STATS_REFRESH_INTERVAL: 300000, // 5 minutes in milliseconds
  
  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 10000,
  
  // Search
  SEARCH_DEBOUNCE_DELAY: 300,
  
  // API endpoints
  API_ENDPOINTS: {
    DRIVERS: '/api/drivers',
    STATS: '/api/stats'
  }
} as const;

export const FILTER_TYPES = {
  HVCI: 'hvci',
  KILLER: 'killer', 
  SIGNED: 'signed',
  UNSIGNED: 'unsigned',
  RECENT: 'recent'
} as const;

export const KILLER_FUNCTIONS = [
  'zwterminateprocess',
  'zwkillprocess', 
  'ntterminate'
] as const;

export const THEME_ATTRIBUTE = 'data-color-scheme';
export const THEME_STORAGE_KEY = 'theme';

export const DEFAULT_STATS = {
  total: 0,
  hvciCompatible: 0,
  killerDrivers: 0,
  signed: 0,
  lastUpdated: new Date().toISOString()
} as const;
