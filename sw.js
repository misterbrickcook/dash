const CACHE_NAME = 'braindump-v3-' + Date.now();
const urlsToCache = [
  '/mobile.html',
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
      .then(() => {
        console.log('PWA: Force updating to latest version');
        return self.skipWaiting();
      })
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
    }).then(() => {
      // Force refresh of all HTML files
      console.log('PWA: Forcing reload of all clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  // Only handle same-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Always try to fetch fresh version in background
          const fetchPromise = fetch(event.request)
            .then(fetchResponse => {
              // Update cache with fresh version
              if (fetchResponse && fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, responseClone));
              }
              return fetchResponse;
            })
            .catch(() => {
              // Network failed, serve from cache or offline fallback
              if (event.request.destination === 'document') {
                return caches.match('/mobile.html') || caches.match('/mobile-v2.html');
              }
            });
          
          // Return cached version immediately, or wait for network
          return response || fetchPromise;
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