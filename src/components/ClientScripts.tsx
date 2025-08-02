'use client';

import { useEffect } from 'react';
import { useIsHydrated } from '@/hooks/useHydration';

export default function ClientScripts() {
  const isHydrated = useIsHydrated();

  useEffect(() => {
    if (!isHydrated) return;

    // Preload intelligente basée sur l'interaction utilisateur
    const preloadStrategy = () => {
      // 1. Preload la page suivante après 2 secondes d'inactivité
      let inactivityTimer: NodeJS.Timeout;
      
      const resetTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          // Preload next page si pas déjà fait
          const currentPage = new URLSearchParams(window.location.search).get('page') || '1';
          const nextPage = parseInt(currentPage) + 1;
          
          fetch(`/api/drivers?page=${nextPage}&limit=20`).catch(() => {
            // Ignore les erreurs de preloading
          });
        }, 2000);
      };

      // 2. Preload au hover sur les liens de pagination
      const paginationLinks = document.querySelectorAll('.pagination-number, .pagination-btn');
      paginationLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
          const page = link.getAttribute('data-page');
          if (page) {
            fetch(`/api/drivers?page=${page}&limit=20`).catch(() => {});
          }
        });
      });

      // 3. Preload les ressources populaires
      const preloadPopularResources = () => {
        const resources = [
          '/api/stats',
          '/api/help-content'
        ];
        
        resources.forEach((url, index) => {
          setTimeout(() => {
            fetch(url).catch(() => {});
          }, index * 500); // Échelonner les requêtes
        });
      };

      // Events pour reset timer
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetTimer, { passive: true });
      });

      resetTimer();
      
      // Preload après 5 secondes
      setTimeout(preloadPopularResources, 5000);

      return () => {
        clearTimeout(inactivityTimer);
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
          document.removeEventListener(event, resetTimer);
        });
      };
    };

    // 4. Intersection Observer pour le lazy loading avancé
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          
          // Preload les données du driver si pas encore fait
          const driverId = target.getAttribute('data-driver-id');
          if (driverId && !target.hasAttribute('data-preloaded')) {
            target.setAttribute('data-preloaded', 'true');
            // Ici on pourrait preloader des détails spécifiques du driver
          }

          // Lazy load des images dans la carte
          const images = target.querySelectorAll('img[data-src]');
          images.forEach(img => {
            const imgElement = img as HTMLImageElement;
            if (imgElement.dataset.src) {
              imgElement.src = imgElement.dataset.src;
              imgElement.removeAttribute('data-src');
            }
          });
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '50px 0px', // Précharger 50px avant que l'élément soit visible
      threshold: 0.1
    });

    // Observer les cartes de drivers
    const driverCards = document.querySelectorAll('.driver-card');
    driverCards.forEach(card => observer.observe(card));

    const cleanup = preloadStrategy();

    return () => {
      cleanup?.();
      observer.disconnect();
    };
  }, [isHydrated]);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator && isHydrated) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore SW registration errors
      });
    }
  }, [isHydrated]);

  return null; // Ce composant n'a pas de rendu visuel
}
