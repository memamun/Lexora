// Versioned cache name - change this on each deploy to invalidate old cache
const CACHE_NAME = 'lexora-cache-v4';
const MAX_CACHE_ENTRIES = 200;

// Static assets that rarely change (icons, manifest)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon.png',
  '/logo.png',
  '/logo.svg'
];

// ─── Install: precache only truly static assets ───
self.addEventListener('install', (event) => {
  // Don't skipWaiting — let the new SW wait for activation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// ─── Activate: claim clients + purge old caches + limit cache size ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control immediately
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Limit cache size to prevent storage bloat
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          if (keys.length > MAX_CACHE_ENTRIES) {
            // Remove oldest entries
            const toDelete = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
            return Promise.all(toDelete.map((key) => cache.delete(key)));
          }
        });
      })
    ])
  );
});

// ─── Fetch strategy ───
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1) API requests — always network-only, never cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2) Navigation requests (HTML pages / SPA routes) — network-first, no-store
  //    Always fetch fresh to ensure latest app version
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('/index.html')) // Offline fallback only
    );
    return;
  }

  // 3) Hashed static assets (Vite bundles like /assets/index-abc123.js)
  //    These are immutable (filename changes on rebuild), so cache-first is safe
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 4) Everything else (images, fonts, etc.) — network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
