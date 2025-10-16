const CACHE_NAME = 'quick-trips-v1.0.0'; // Update version when deploying

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/main.js',
  '/assets/logo.png',
  '/assets/favicon-32x32.png',
  '/assets/logo-192.png',
  '/assets/fallback.jpg',
  // Hero images
  '/assets/hero-image-1.jpg',
  '/assets/hero-image-2.jpg',
  '/assets/hero-image-3.jpg',
  '/assets/hero-image-4.jpg',
  // Service images
  '/assets/european.jpg',
  '/assets/visa.jpg',
  '/assets/hotelreservation.jpg',
  '/assets/logistics.jpg',
  '/assets/bookflight.jpg',
  '/assets/grouptravel.jpg',
  '/assets/bespoke.jpg',
  // Destination images
  '/assets/turkey.jpg',
  '/assets/scotland.jpg',
  '/assets/cyprus.jpg',
  '/assets/italy.jpg',
  '/assets/singapore.jpg',
  '/assets/emirates.jpg',
  '/assets/paris2.jpg',
  '/assets/maldives.jpg',
  '/assets/egypt.jpg',
  '/assets/sao-tome.jpg',
  // Blog images
  '/assets/destinations.jpg',
  '/assets/passport.jpg',
  '/assets/pro.jpg',
  '/assets/comany_retreat.jpg',
  '/assets/travel.jpg',
  '/assets/travel_2.jpg'
];

// Install: Cache all static assets
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  self.skipWaiting(); // Activate immediately
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('SW: Cache failed', err))
  );
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart caching strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // HTML: Stale-while-revalidate (show cached, update in background)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return caches.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            const responseToCache = networkResponse.clone();
            cache.put(event.request, responseToCache);
            
            // Notify clients about update
            if (cachedResponse && networkResponse.status === 200) {
              self.clients.matchAll().then(clients => {
                clients.forEach(client => 
                  client.postMessage({ type: 'UPDATE_DETECTED' })
                );
              });
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
  } 
  // Assets: Cache-first with background refresh
  else {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Background refresh
          fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          }).catch(() => {}); // Ignore network errors
          return cachedResponse;
        }
        
        // Cache miss: fetch and cache
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // Offline fallback for critical assets
          return caches.match('/assets/fallback.jpg');
        });
      })
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'FORCE_UPDATE') {
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    }).then(() => {
      event.ports?.[0]?.postMessage({ success: true });
    });
  }
});