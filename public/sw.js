// Service Worker — caching in production, self-destruct in development.
//
// In dev, Turbopack reuses stable chunk URLs whose contents change between
// edits. A cache-first SW then serves stale chunks, breaking hydration
// ("module factory is not available") and leaving the UI non-interactive.
// So on localhost this worker wipes its caches, unregisters itself, and
// reloads open tabs into a clean, SW-free state.

const CACHE_NAME = 'loldrivers-v3';
const STATIC_CACHE = 'static-v3';
const API_CACHE = 'api-v3';

const DEV_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
const IS_DEV = DEV_HOSTS.includes(self.location.hostname);

// Only cache paths that actually exist at runtime
const STATIC_ASSETS = ['/', '/favicon.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  if (IS_DEV) return;
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  if (IS_DEV) {
    event.waitUntil(
      (async () => {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch {}
        try {
          await self.registration.unregister();
        } catch {}
        try {
          const clients = await self.clients.matchAll({ type: 'window' });
          clients.forEach((client) => client.navigate(client.url));
        } catch {}
      })()
    );
    return;
  }

  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => ![CACHE_NAME, STATIC_CACHE, API_CACHE].includes(name))
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // In dev, never intercept — let everything hit the dev server directly.
  if (IS_DEV) return;

  const { request } = event;
  const url = new URL(request.url);

  // Cache-first for Next.js hashed static assets (immutable per build)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((response) => {
          if (response) return response;
          return fetch(request).then((fetchResponse) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      )
    );
    return;
  }

  // Cache-first for other static assets (fonts, favicons)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    url.pathname.includes('/favicon')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((response) => {
          if (response) return response;
          return fetch(request).then((fetchResponse) => {
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
      caches.open(API_CACHE).then((cache) =>
        cache.match(request).then((response) => {
          const fetchPromise = fetch(request).then((fetchResponse) => {
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
