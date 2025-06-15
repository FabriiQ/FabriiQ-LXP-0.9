// Service Worker for Activity Offline Support & tRPC Caching

// Cache names - use distinct names for different caches for easier management
const CACHE_NAME = 'static-assets-cache-v1'; // For precached static assets
const ACTIVITY_DATA_CACHE = 'activity-data-cache-v1'; // For specific activity data fetched by app
const API_CACHE = 'api-cache-v1'; // For tRPC GET queries and other API responses
const RUNTIME_CACHE = 'runtime-dynamic-cache-v1'; // For dynamically cached HTML/assets during runtime

// Assets to cache immediately on service worker install
const PRECACHE_ASSETS = [
  '/', // Often maps to index.html
  // '/index.html', // Explicitly if needed, depends on server config
  // '/static/css/main.css', // Example, adjust to actual build output
  // '/static/js/main.js',   // Example, adjust to actual build output
  '/manifest.json',
  '/favicon.ico',
  '/offline.html' // Fallback offline page
  // Add other critical static assets (JS chunks, CSS files, key images/icons)
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[Service Worker] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      }),
      // No specific API pre-caching here for now, can be added if specific tRPC queries are safe to pre-cache
    ])
    .then(() => {
       console.log('[Service Worker] Static assets precached, skipWaiting.');
       return self.skipWaiting(); // Activate new SW immediately
    })
    .catch(error => {
        console.error('[Service Worker] Precaching failed:', error);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event');
  const currentCaches = [CACHE_NAME, ACTIVITY_DATA_CACHE, API_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
       console.log('[Service Worker] Old caches deleted, clients claimed.');
       return self.clients.claim(); // Take control of uncontrolled clients
    })
    .catch(error => {
        console.error('[Service Worker] Activation failed:', error);
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only process requests from our origin (or specific CDNs if needed)
  if (url.origin !== self.location.origin) {
    // console.log('[Service Worker] Ignoring cross-origin request:', event.request.url);
    return; // Let browser handle it
  }

  // Handle tRPC API requests (network-first for GET, network-only for POST/mutations)
  if (url.pathname.startsWith('/api/trpc/')) {
    // console.log('[Service Worker] Handling tRPC API request:', event.request.url, event.request.method);
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Example: Handle other specific /api/ routes (e.g., auth, non-tRPC file uploads)
  // if (url.pathname.startsWith('/api/auth/')) {
  //   // Use a specific strategy for auth, often network-only
  //   event.respondWith(fetch(event.request));
  //   return;
  // }

  // Handle activity data requests (cache-first) - if these are distinct non-tRPC paths
  // e.g., /data/activities/some-id.json
  if (url.pathname.includes('/activities/') && !url.pathname.startsWith('/api/')) {
    // console.log('[Service Worker] Handling Activity Data request:', event.request.url);
    event.respondWith(handleActivityDataRequest(event.request));
    return;
  }
  
  // Handle HTML navigation and direct HTML requests (Network-first, then cache, then offline fallback)
  if (event.request.mode === 'navigate' ||
      (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'))) {
    // console.log('[Service Worker] Handling Navigate/HTML request:', event.request.url);
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const resClone = response.clone();
            caches.open(RUNTIME_CACHE)
              .then(cache => cache.put(event.request, resClone))
              .catch(err => console.warn('[Service Worker] Error caching HTML response:', err));
          }
          return response;
        })
        .catch(() => {
          // console.log('[Service Worker] Network failed for HTML, trying cache for:', event.request.url);
          return caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                // console.log('[Service Worker] No cache for HTML, serving offline page for:', event.request.url);
                return caches.match('/offline.html');
            })
        })
    );
    return;
  }

  // Default: Cache-first with stale-while-revalidate for other GET requests (static assets like CSS, JS, images)
  if (event.request.method === 'GET') {
    // console.log('[Service Worker] Handling Static Asset request:', event.request.url);
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          }
          return networkResponse;
        }).catch(err => {
          // console.warn('[Service Worker] Stale-while-revalidate fetch failed for:', event.request.url, err);
          // If fetch fails (e.g. offline) and we served from cache, this error is not critical to the user here.
          // If not in cache initially, this error will propagate to the main catch.
        });

        if (cachedResponse) {
          // Return cached response immediately
          return cachedResponse;
        }
        // If not in cache, wait for the network response
        return fetchPromise;
      }).catch(() => {
          // Fallback for other assets if needed, e.g., placeholder image
          if (event.request.destination === 'image') {
              // return caches.match('/placeholder-image.png'); // Ensure placeholder is in PRECACHE_ASSETS
          }
          // console.warn('[Service Worker] Asset not in cache and network fetch failed for:', event.request.url);
          return new Response('Network error and asset not in cache.', { status: 404, statusText: 'Not Found' });
      })
    );
    return;
  }

  // For non-GET requests that weren't handled (e.g. some specific POSTs not to /api/trpc),
  // just fetch from network without caching.
  // console.log('[Service Worker] Unhandled request (non-GET or specific path), fetching normally:', event.request.url);
  // event.respondWith(fetch(event.request)); // Or simply don't call event.respondWith to let browser handle.
});


// handleApiRequest function (Network-first for GET, network-only for non-GET/mutations)
async function handleApiRequest(request: Request) {
  try {
    const networkResponse = await fetch(request);
    // For GET requests, cache the response if successful
    if (request.method === 'GET' && networkResponse && networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      // request.clone() is not strictly necessary for cache.put's first arg if request is not used again for body consumption.
      // networkResponse.clone() is essential as response body can be consumed only once.
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // console.warn('[Service Worker] Network failed for API request:', request.url, error);
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // console.log('[Service Worker] Serving API request from cache:', request.url);
        return cachedResponse;
      }
    }
    // console.error('[Service Worker] API request failed, no cache fallback for non-GET or not in cache.');
    return new Response(JSON.stringify({ error: 'Network error and no cache fallback available.', details: (error instanceof Error ? error.message : String(error)) }), {
      status: 503, // Service Unavailable
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// handleActivityDataRequest function (Cache-first) - For specific, non-tRPC data paths
async function handleActivityDataRequest(request: Request) {
  try {
    const cache = await caches.open(ACTIVITY_DATA_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // console.log('[Service Worker] Serving activity data from cache:', request.url);
      return cachedResponse;
    }
    
    // console.log('[Service Worker] Activity data not in cache, fetching from network:', request.url);
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // console.error('[Service Worker] Activity data request failed (network and cache):', request.url, error);
    return new Response(JSON.stringify({ error: 'Failed to load activity data.', details: (error instanceof Error ? error.message : String(error)) }), {
      status: 503, // Service Unavailable
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Message event - handle messages from clients (e.g., SKIP_WAITING)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message, calling self.skipWaiting().');
    self.skipWaiting();
  }
});

// Note: The 'sync' event listener for 'activity-results-sync' has been removed as requested.
