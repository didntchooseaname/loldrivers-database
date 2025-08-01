// Utilities to avoid hydration errors

export function formatDateConsistent(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Utiliser un format ISO pour la consistance serveur/client
    return dateObj.toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return 'Invalid date';
  }
}

export function formatDateLocale(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Explicit French format to avoid locale differences
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getSeconds().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return 'Invalid date';
  }
}

// Hook to avoid hydration error with dates
export function useSafeDate(date: string | Date | null): string {
  // Return default value during hydration
  if (typeof window === 'undefined') {
    // Server-side - consistent format
    return date ? formatDateLocale(date) : 'Loading...';
  }
  
  // Client-side - same format
  return date ? formatDateLocale(date) : 'Loading...';
}
