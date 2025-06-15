// Service Worker for Activity Offline Support
const CACHE_NAME = 'activity-cache-v1';
const ACTIVITY_DATA_CACHE = 'activity-data-v1';
const API_CACHE = 'activity-api-v1';

// Assets to cache immediately on service worker install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

// API routes to cache
const API_ROUTES = [
  '/api/activities',
  '/api/subjects',
  '/api/classes'
];

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      }),
      
      // Cache API routes
      caches.open(API_CACHE).then(cache => {
        console.log('Precaching API routes');
        return Promise.all(
          API_ROUTES.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(error => console.error(`Failed to cache ${url}:`, error))
          )
        );
      })
    ])
    .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, ACTIVITY_DATA_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle activity data requests
  if (event.request.url.includes('/activities/')) {
    event.respondWith(handleActivityDataRequest(event.request));
    return;
  }
  
  // Handle static asset requests
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(error => {
          console.error('Fetch failed:', error);
          
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          
          return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Clone and cache successful responses
    if (networkResponse && networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(API_CACHE);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Falling back to cache for API request:', request.url);
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return error response
    return new Response(JSON.stringify({ error: 'Network error', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle activity data requests with cache-first strategy
async function handleActivityDataRequest(request) {
  // Try cache first for activity data
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    // Clone and cache successful responses
    if (networkResponse && networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(ACTIVITY_DATA_CACHE);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch activity data:', error);
    
    // Return error response
    return new Response(JSON.stringify({ error: 'Failed to load activity data', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Sync event - handle background syncing
self.addEventListener('sync', event => {
  if (event.tag === 'activity-results-sync') {
    event.waitUntil(syncActivityResults());
  }
});

// Function to sync activity results from IndexedDB to server
async function syncActivityResults() {
  // This will be implemented in the IndexedDB module
  // The service worker will just trigger the sync event
  console.log('Syncing activity results...');
  
  // Broadcast sync status to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STATUS',
        status: 'syncing'
      });
    });
  });
  
  // In a real implementation, we would:
  // 1. Open IndexedDB
  // 2. Get all pending results
  // 3. Send them to the server
  // 4. Mark them as synced in IndexedDB
  // 5. Notify clients of sync completion
  
  // For now, just simulate a successful sync after a delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Broadcast sync completion to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STATUS',
        status: 'completed'
      });
    });
  });
}

// Message event - handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
