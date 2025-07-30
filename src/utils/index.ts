/**
 * Utilitaires optimisés pour les performances
 */

// Cache pour les dates formatées
const dateFormatCache = new Map<string, string>();
const MAX_DATE_CACHE_SIZE = 1000;

/**
 * Format a date string in French locale avec cache
 */
export function formatDateLocale(dateString: string | null): string {
  if (!dateString) return 'Date non disponible';
  
  // Vérifier le cache
  if (dateFormatCache.has(dateString)) {
    return dateFormatCache.get(dateString)!;
  }
  
  try {
    const date = new Date(dateString);
    const formatted = new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
    
    // Mise en cache avec limite de taille
    if (dateFormatCache.size >= MAX_DATE_CACHE_SIZE) {
      const firstKey = dateFormatCache.keys().next().value;
      if (firstKey) {
        dateFormatCache.delete(firstKey);
      }
    }
    dateFormatCache.set(dateString, formatted);
    
    return formatted;
  } catch {
    return 'Date invalide';
  }
}

/**
 * Normalisation optimisée des chaînes pour la recherche
 */
export function normalizeString(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents
}

/**
 * Escape HTML pour prévenir XSS (avec cache)
 */
const htmlEscapeCache = new Map<string, string>();
const MAX_HTML_CACHE_SIZE = 500;

export function escapeHtml(text: string | number | null | undefined): string {
  if (!text) return '';
  
  const textStr = text.toString();
  
  if (htmlEscapeCache.has(textStr)) {
    return htmlEscapeCache.get(textStr)!;
  }
  
  const div = document.createElement('div');
  div.textContent = textStr;
  const escaped = div.innerHTML;
  
  // Mise en cache avec limite
  if (htmlEscapeCache.size >= MAX_HTML_CACHE_SIZE) {
    const firstKey = htmlEscapeCache.keys().next().value;
    if (firstKey) {
      htmlEscapeCache.delete(firstKey);
    }
  }
  htmlEscapeCache.set(textStr, escaped);
  
  return escaped;
}

/**
 * Debounce function optimisée
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function pour limiter la fréquence d'exécution
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= wait) {
      lastCall = now;
      func(...args);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, wait - (now - lastCall));
    }
  };
}

/**
 * Générer un ID unique optimisé
 */
let idCounter = 0;
export function generateId(): string {
  return `id_${Date.now()}_${++idCounter}`;
}

/**
 * Créer une clé de cache pour les recherches
 */
export function createSearchKey(query: string, filters: Record<string, unknown>, page: number, limit: number): string {
  return `search:${normalizeString(query)}_${JSON.stringify(filters)}_${page}_${limit}`;
}

/**
 * Calculer le hash d'un fichier pour la validation du cache
 */
export async function calculateFileHash(content: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback simple hash pour les environnements sans crypto.subtle
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Intersection optimisée de deux ensembles
 */
export function intersectSets<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const result = new Set<T>();
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  
  smaller.forEach(item => {
    if (larger.has(item)) {
      result.add(item);
    }
  });
  
  return result;
}

/**
 * Performance monitoring utilitaire
 */
export function markPerformance(name: string, detail?: unknown): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name, { detail });
  }
}

export function measurePerformance(startMark: string, endMark: string, measureName: string): number | null {
  if (typeof performance !== 'undefined' && performance.measure && performance.getEntriesByName) {
    try {
      performance.measure(measureName, startMark, endMark);
      const measures = performance.getEntriesByName(measureName);
      return measures.length > 0 ? measures[0].duration : null;
    } catch {
      console.warn('Performance measurement failed');
      return null;
    }
  }
  return null;
}
