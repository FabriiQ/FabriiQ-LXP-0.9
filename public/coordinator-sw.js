// Service Worker for Coordinator Portal
const CACHE_NAME = 'coordinator-portal-cache-v1'; // Static assets for coordinator
const RUNTIME_CACHE = 'coordinator-runtime-cache-v1'; // Dynamic content (HTML, etc.)
const API_CACHE = 'coordinator-api-cache-v1'; // For API GET requests

// Resources to cache on install - Adjust to actual coordinator portal paths
const PRECACHE_ASSETS = [ // Changed from PRECACHE_URLS to PRECACHE_ASSETS as per new code
  // '/', // Careful with '/' if it serves dynamic content; prefer specific static HTML file if any
  '/admin/coordinator', // Assuming this is an entry point HTML
  '/admin/coordinator/dashboard', // Another potential entry point
  '/offline.html', // Generic offline fallback page
  // Add other critical static assets: manifest.json, favicon, key CSS/JS if not hashed
  // e.g. '/manifest-coordinator.json', '/favicon-coordinator.ico'
];

// API_ROUTES array removed as per new strategy (no API pre-caching)

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => { // Use CACHE_NAME for static assets
      console.log('[Coordinator SW] Precaching static assets');
      return cache.addAll(PRECACHE_ASSETS); // Use PRECACHE_ASSETS
    })
    // Removed API pre-caching block
    .then(() => {
      console.log('[Coordinator SW] Static assets precached, calling skipWaiting.');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('[Coordinator SW] Precaching failed:', error);
    })
  );
});

// Fetch event - new strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only process requests from our origin
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle API requests (now using the updated handleApiRequest)
  if (url.pathname.startsWith('/api/')) { // Ensure this path correctly captures all tRPC and other API calls
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle static asset requests (HTML, CSS, JS, images etc.)
  // For HTML pages - network first, then cache, then offline fallback
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const resClone = response.clone();
            caches.open(RUNTIME_CACHE)
              .then(cache => cache.put(event.request, resClone));
          }
          return response;
        })
        .catch(async () => { // Added async here
          const cached = await caches.match(event.request);
          return cached || caches.match('/offline.html'); // Ensure offline.html is in PRECACHE_ASSETS
        })
    );
    return;
  }

  // Default: Cache-first with stale-while-revalidate for other GET requests (static assets)
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const networked = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const resClone = networkResponse.clone();
            // Static assets that are not part of PRECACHE_ASSETS but fetched at runtime
            // can also go into RUNTIME_CACHE or CACHE_NAME depending on strategy.
            // Using RUNTIME_CACHE here for dynamically fetched static assets.
            caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, resClone));
          }
          return networkResponse;
        }).catch(() => {
          // console.warn('[Coordinator SW] Stale-while-revalidate fetch failed, serving stale if present.');
        });

        return cachedResponse || networked; // Return cached if available, else the network promise
      }).catch(() => {
          // Fallback for other assets if needed, e.g., placeholder image
          if (event.request.destination === 'image') {
              // return caches.match('/placeholder-image.png'); // Make sure placeholder exists in PRECACHE_ASSETS
          }
          return new Response('Network error and not in cache.', { status: 404, statusText: 'Not Found' });
      })
    );
    return;
  }
});

// Updated handleApiRequest function
async function handleApiRequest(request) {
  // For non-GET requests (mutations: POST, PUT, DELETE, etc.), always try network and do not cache response for serving.
  if (request.method !== 'GET') {
    // console.log('[Coordinator SW] Handling non-GET API request (network-only):', request.url);
    try {
      const networkResponse = await fetch(request.clone()); // Clone request if its body is to be consumed by SW logic (not typical here)
      return networkResponse;
    } catch (error) {
      // console.error('[Coordinator SW] Network error for non-GET API request:', request.url, error);
      return new Response(JSON.stringify({ error: 'Network error during API operation.', details: error.message }), {
        status: 503, // Service Unavailable
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // For GET requests: Network-first, then cache strategy.
  // console.log('[Coordinator SW] Handling GET API request (network-first):', request.url);
  try {
    const networkResponse = await fetch(request);
    
    // If network request is successful, cache it and return it.
    if (networkResponse && networkResponse.ok) {
      // console.log('[Coordinator SW] API request successful from network, caching and returning:', request.url);
      const cache = await caches.open(API_CACHE);
      // Clone the response to cache it as it can only be consumed once.
      // Clone the request as well if you are using it as a key and it might be modified.
      await cache.put(request.clone(), networkResponse.clone());
      return networkResponse;
    }
    // If networkResponse is not ok (e.g. 404, 500 but still a response from server),
    // don't cache, but return it. Let the application handle server errors.
    // However, if the fetch itself throws (offline, network partition), it goes to catch.
    if (networkResponse) {
        // console.warn('[Coordinator SW] Network request for API was not ok, not caching:', request.url, networkResponse.status);
        return networkResponse;
    }
    // This part might be unreachable if fetch throws on non-ok, but as a safeguard:
    throw new Error(`Network request failed with status ${networkResponse?.status || 'unknown'}`);

  } catch (error) {
    // console.warn('[Coordinator SW] Network failed for API request, trying cache:', request.url, error);
    // If network fails, try to get the response from the cache.
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // console.log('[Coordinator SW] Serving API request from cache:', request.url);
      return cachedResponse;
    }

    // If not in cache and network failed, return an error response.
    // console.error('[Coordinator SW] API request failed, no cache fallback:', request.url, error);
    return new Response(JSON.stringify({ error: 'Failed to load data: Network error and not in cache.', details: error.message }), {
      status: 503, // Service Unavailable
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The 'sync' event listener and processSyncQueue function have been removed.
// Client-initiated sync via src/features/coordinator/offline/sync.ts will be the sole method.
