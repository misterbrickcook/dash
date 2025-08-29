const CACHE_NAME = 'braindump-v1';
const urlsToCache = [
  '/mobile-v2.html',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('PWA: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('PWA: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Only handle same-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached version or fetch from network
          return response || fetch(event.request).catch(() => {
            // If both cache and network fail, return offline page for HTML requests
            if (event.request.destination === 'document') {
              return caches.match('/mobile-v2.html');
            }
          });
        })
    );
  }
});

// Background sync for queued items (future enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('PWA: Background sync triggered');
    // Could sync queued items here
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    console.log('PWA: Push message received');
    // Could show notifications here
  }
});