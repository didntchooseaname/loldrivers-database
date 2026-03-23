// Service Worker for advanced caching
const CACHE_NAME = 'loldrivers-v2';
const STATIC_CACHE = 'static-v2';
const API_CACHE = 'api-v2';

// Only cache paths that actually exist at runtime
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(STATIC_ASSETS)
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => ![CACHE_NAME, STATIC_CACHE, API_CACHE].includes(name))
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first for Next.js hashed static assets (immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(request).then(response => {
          if (response) return response;
          return fetch(request).then(fetchResponse => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      )
    );
    return;
  }

  // Cache-first for other static assets (fonts, favicons)
  if (request.destination === 'style' || request.destination === 'script' ||
      request.destination === 'font' || url.pathname.includes('/favicon')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(request).then(response => {
          if (response) return response;
          return fetch(request).then(fetchResponse => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      )
    );
    return;
  }

  // Stale-while-revalidate for API routes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache =>
        cache.match(request).then(response => {
          const fetchPromise = fetch(request).then(fetchResponse => {
            if (fetchResponse.status === 200) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
          return response || fetchPromise;
        })
      )
    );
    return;
  }

  // Network-first for navigation
  event.respondWith(
    fetch(request).catch(() => {
      if (request.destination === 'document') {
        return caches.match('/');
      }
    })
  );
});
