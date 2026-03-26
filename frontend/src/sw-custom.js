// Service Worker for fryly - handles push notifications
// This file is used with VitePWA's injectManifest strategy

// The VitePWA plugin will inject the precache manifest here
self.__WB_MANIFEST;

const CACHE_NAME = 'fryly-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/teamwork.png'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when possible (only for static assets, not API calls)
self.addEventListener('fetch', (event) => {
  // Don't cache API requests - only cache static assets
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) {
    // Always go to network for API requests
    return;
  }

  // For non-API requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('Fetch failed:', error);
        // Return a basic response if fetch fails completely
        return new Response('Network error', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || 'fryly';
    const options = {
      body: data.body || '',
      icon: '/teamwork.png',
      badge: '/teamwork.png',
      data: data.data || {},
      vibrate: [200, 100, 200],
      tag: 'fryly-notification',
      requireInteraction: false
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Navigate to the app or specific page
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Only open a new window if no existing window found
      // This prevents opening Edge when the app is already open
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync (optional - for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Sync logic here
      Promise.resolve()
    );
  }
});
