/**
 * Format a date string in French locale
 */
export function formatDateLocale(dateString: string | null): string {
  if (!dateString) return 'Date non disponible';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    return 'Date invalide';
  }
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: any): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text.toString();
  return div.innerHTML;
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
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
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
