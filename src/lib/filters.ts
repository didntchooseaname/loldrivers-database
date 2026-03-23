// Single source of truth for all filter definitions.
// Used by URL parsing, URL serialization, SWR key building, and share links.

export interface FilterDef {
  /** URL parameter name */
  param: string;
  /** Internal Set<string> key used in activeFilters */
  key: string;
}

export const BOOLEAN_FILTERS: FilterDef[] = [
  { param: 'hvci', key: 'hvci' },
  { param: 'killer', key: 'killer' },
  { param: 'trusted-cert', key: 'trusted-cert' },
  { param: 'untrusted-cert', key: 'untrusted-cert' },
  { param: 'recent', key: 'recent' },
  { param: 'newest-first', key: 'newest-first' },
  { param: 'oldest-first', key: 'oldest-first' },
  // Certificate validation
  { param: 'cert-revoked', key: 'cert-revoked' },
  { param: 'cert-expired', key: 'cert-expired' },
  { param: 'cert-suspicious', key: 'cert-suspicious' },
  { param: 'cert-valid', key: 'cert-valid' },
  { param: 'cert-missing', key: 'cert-missing' },
  // Behavioral
  { param: 'memory-manipulator', key: 'memory-manipulator' },
  { param: 'process-killer', key: 'process-killer' },
  { param: 'debug-bypass', key: 'debug-bypass' },
  { param: 'registry-manipulator', key: 'registry-manipulator' },
  { param: 'file-manipulator', key: 'file-manipulator' },
];

export const ARCHITECTURE_VALUES = ['AMD64', 'I386', 'ARM64'] as const;

/** Parse URL search params into filter state */
export function parseFiltersFromURL(params: URLSearchParams): {
  searchQuery: string;
  activeFilters: Set<string>;
  currentPage: number;
} {
  const searchQuery = params.get('q') || '';
  const activeFilters = new Set<string>();

  for (const f of BOOLEAN_FILTERS) {
    if (params.get(f.param) === 'true') activeFilters.add(f.key);
  }

  const arch = params.get('architecture');
  if (arch && (ARCHITECTURE_VALUES as readonly string[]).includes(arch)) {
    activeFilters.add(`architecture-${arch}`);
  }

  const pageParam = params.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  return { searchQuery, activeFilters, currentPage };
}

/** Serialize active filters + search into URLSearchParams (for browser URL and share links) */
export function serializeFiltersToParams(
  activeFilters: Set<string>,
  searchQuery: string,
  currentPage: number,
): URLSearchParams {
  const params = new URLSearchParams();

  if (searchQuery.trim()) params.set('q', searchQuery.trim());

  for (const f of BOOLEAN_FILTERS) {
    if (activeFilters.has(f.key)) params.set(f.param, 'true');
  }

  for (const arch of ARCHITECTURE_VALUES) {
    if (activeFilters.has(`architecture-${arch}`)) {
      params.set('architecture', arch);
    }
  }

  if (currentPage > 1) params.set('page', currentPage.toString());

  return params;
}

/** Build API URL for SWR fetching (always includes page + limit) */
export function buildApiUrl(
  activeFilters: Set<string>,
  searchQuery: string,
  currentPage: number,
  itemsPerPage: number,
): string {
  const params = new URLSearchParams();
  params.set('page', currentPage.toString());
  params.set('limit', itemsPerPage.toString());

  if (searchQuery.trim()) params.set('q', searchQuery.trim());

  for (const f of BOOLEAN_FILTERS) {
    if (activeFilters.has(f.key)) params.set(f.param, 'true');
  }

  for (const arch of ARCHITECTURE_VALUES) {
    if (activeFilters.has(`architecture-${arch}`)) {
      params.set('architecture', arch);
    }
  }

  return `/api/drivers?${params.toString()}`;
}
