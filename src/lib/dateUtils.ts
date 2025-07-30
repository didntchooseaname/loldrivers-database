// Utilitaires pour éviter les erreurs d'hydratation

export function formatDateConsistent(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Utiliser un format ISO pour la consistance serveur/client
    return dateObj.toISOString().replace('T', ' ').slice(0, 19);
  } catch (error) {
    return 'Invalid date';
  }
}

export function formatDateLocale(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Format français explicite pour éviter les différences de locale
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getSeconds().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return 'Invalid date';
  }
}

// Hook pour éviter l'erreur d'hydratation avec les dates
export function useSafeDate(date: string | Date | null): string {
  // Retourner une valeur par défaut pendant l'hydratation
  if (typeof window === 'undefined') {
    // Côté serveur - format cohérent
    return date ? formatDateLocale(date) : 'Loading...';
  }
  
  // Côté client - même format
  return date ? formatDateLocale(date) : 'Loading...';
}
