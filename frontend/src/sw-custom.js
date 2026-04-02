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

  // Don't intercept navigation requests
  if (event.request.mode === 'navigate') {
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
  );
});

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) {
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
    // Silently handle parse error
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  // Navigate to the app or specific page
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // If a window is already open, navigate it to the target URL
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then(c => c && c.focus());
          }
          return client.focus();
        }
      }
      // Open a new window at the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
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
