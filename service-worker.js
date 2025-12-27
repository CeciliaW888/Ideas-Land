const CACHE_NAME = 'idea-land-v1';

// List of local files to pre-cache immediately
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './utils/styles.ts',
  './utils/helpers.ts',
  './components/Header.tsx',
  './components/Editor.tsx',
  './components/Toolbar.tsx',
  './components/SettingsModal.tsx',
  // Assuming icons exist based on manifest
  './icon-192.png',
  './icon-512.png' 
];

// Install Event: Cache local files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_URLS);
      })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First, Fallback to Cache
// We use Stale-While-Revalidate logic for CDN links (esm.sh) and Cache First for local assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy for External Dependencies (esm.sh, etc.)
  // We try to cache them dynamically as they are requested
  if (url.origin !== location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached response immediately if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network and cache it for next time
        return fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }

          // Clone the response (streams can only be consumed once)
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy for Local Files
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});