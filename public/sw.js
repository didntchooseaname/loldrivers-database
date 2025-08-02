// Service Worker pour cache avancé
const CACHE_NAME = 'loldrivers-v1';
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';

// Assets à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/globals.css',
  '/favicon.svg',
  '/manifest.json'
];

// APIs à mettre en cache
const API_ENDPOINTS = [
  '/api/drivers',
  '/api/stats'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache des assets statiques
      caches.open(STATIC_CACHE).then(cache => 
        cache.addAll(STATIC_ASSETS)
      ),
      // Pre-cache première page d'API
      caches.open(API_CACHE).then(cache => 
        cache.add('/api/drivers?limit=50')
      )
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![CACHE_NAME, STATIC_CACHE, API_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache strategy pour les assets statiques
  if (request.destination === 'style' || request.destination === 'script' || 
      request.destination === 'font' || url.pathname.includes('/favicon')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) return response;
          
          return fetch(request).then(fetchResponse => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Cache strategy pour les APIs
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return cache.match(request).then(response => {
          const fetchPromise = fetch(request).then(fetchResponse => {
            // Ne cache que les réponses 200
            if (fetchResponse.status === 200) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });

          // Stale-while-revalidate
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Network first pour les autres requêtes
  event.respondWith(
    fetch(request).catch(() => {
      if (request.destination === 'document') {
        return caches.match('/');
      }
    })
  );
});
