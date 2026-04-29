/**
 * Service Worker — CetakRaport TK PWA
 * Provides offline caching, install capability, and faster repeat loads.
 */

const CACHE_NAME = 'cetakraport-pwa-v2';

const PRECACHE_URLS = [
  '/',
  '/pwa-icon-192x192.png',
  '/pwa-icon-512x512.png',
  '/pwa-icon-180x180.png',
  '/manifest.json',
];

// ─── Install ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch — Network-first with cache fallback ──────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;
  if (request.url.includes('/auth/')) return;

  // Navigation — network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Static assets — cache-first
  if (
    request.url.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ttf|eot)$/) ||
    request.url.includes('fonts.googleapis.com') ||
    request.url.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default — network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ─── Push Notification ───────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Pesan Baru';
  const options = {
    body: data.body || '',
    icon: '/pwa-icon-192x192.png',
    badge: '/pwa-icon-192x192.png',
    tag: data.tag || 'chat',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/school-hub' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click ──────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/school-hub';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
