// Configuration de l'application optimisée pour les performances
export const APP_CONFIG = {
  // Cache configuration - Durées optimisées
  CACHE_TTL: 3600, // 1 hour in seconds
  EXTENDED_CACHE_TTL: 7200, // 2 hours for stable data
  CLIENT_CACHE_TIME: 300000, // 5 minutes in milliseconds  
  STATS_REFRESH_INTERVAL: 600000, // 10 minutes in milliseconds
  SEARCH_CACHE_TTL: 300000, // 5 minutes for search results
  
  // Pagination optimisée
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000, // Réduit pour éviter la surcharge mémoire
  VIRTUAL_LIST_ITEM_HEIGHT: 120,
  VIRTUAL_LIST_BUFFER: 5,
  
  // Search et performance
  SEARCH_DEBOUNCE_DELAY: 300,
  SEARCH_MIN_LENGTH: 2, // Minimum 2 caractères pour la recherche
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

// Regex pré-compilées pour les performances
export const KILLER_FUNCTIONS_REGEX = /zwterminateprocess|zwkillprocess|ntterminate/i;

export const KILLER_FUNCTIONS = [
  'zwterminateprocess',
  'zwkillprocess', 
  'ntterminate'
] as const;

// Normalisation des chaînes optimisée
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

// Configuration de cache pour différents types de données
export const CACHE_KEYS = {
  ALL_DRIVERS: 'drivers:all',
  SEARCH_PREFIX: 'search:',
  STATS: 'stats:main',
  FILE_HASH: 'file:hash',
  INDEX: 'search:index'
} as const;

// Headers de cache optimisés
export const CACHE_HEADERS = {
  STATIC_ASSETS: 'public, max-age=31536000, immutable',
  API_SHORT: 'public, max-age=300, stale-while-revalidate=3600',
  API_LONG: 'public, max-age=3600, stale-while-revalidate=86400',
  NO_CACHE: 'no-cache, no-store, must-revalidate'
} as const;
