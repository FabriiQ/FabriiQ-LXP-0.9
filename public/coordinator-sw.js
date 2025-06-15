// Service Worker for Coordinator Portal
const CACHE_NAME = 'coordinator-portal-cache-v1';
const RUNTIME_CACHE = 'runtime-cache';
const API_CACHE = 'api-cache';

// Resources to cache on install
const PRECACHE_URLS = [
  '/admin/coordinator',
  '/admin/coordinator/dashboard',
  '/offline.html'
];

// API routes to cache
const API_ROUTES = [
  '/api/trpc/analytics.getTeacherPerformance',
  '/api/trpc/teacher.getAllTeachers',
  '/api/trpc/student.getAllStudents'
];

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
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

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
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
          
          caches.open(RUNTIME_CACHE).then(cache => {
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

// Handle API requests
async function handleApiRequest(request) {
  // Try to get from cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached response and update cache in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(API_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }
      })
      .catch(error => console.error('Background fetch failed:', error));
    
    return cachedResponse;
  }
  
  // If not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    // Clone and cache successful responses
    if (networkResponse && networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(API_CACHE);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch API data:', error);
    
    // Return error response
    return new Response(JSON.stringify({ error: 'Failed to load data', offline: true }), {
      status: 503,
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

// Sync event - handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'coordinator-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// Process sync queue
async function processSyncQueue() {
  // This would be implemented to work with the IndexedDB sync queue
  // For now, just log that sync was triggered
  console.log('Background sync triggered for coordinator portal');
  
  // Send a message to the client to trigger sync
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_TRIGGERED',
        timestamp: Date.now()
      });
    });
  });
}
