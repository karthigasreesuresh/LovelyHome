const CACHE_NAME = 'lovelyhome-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon-192.svg',
  '/pwa-icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only for API requests. NEVER cache private API health data, auth tokens, or POST requests.
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        // Explicit safety fallback for offline API calls: return network error JSON
        return new Response(
          JSON.stringify({
            error: 'Network connection unavailable. Live health records, caregiver synchronization, and emergency SOS require an active internet connection.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Stale-while-revalidate strategy for app static assets shell
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network errors for background revalidation */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
