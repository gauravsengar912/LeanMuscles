/**
 * SweatItOut — Service Worker
 * Strategy: Cache-first for static assets, network-first for API calls.
 */

const CACHE_NAME   = 'sweatitout-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/config.js',
  '/icon-192.png',
  '/icon-512.png'
];

/* ── Install: pre-cache shell ──────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: clear old caches ────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: smart routing ──────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin API requests (Supabase / Cerebras)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('cerebras.ai')) return;
  if (url.hostname.includes('openfoodfacts.org')) return;
  if (url.hostname.includes('googleapis.com')) return;

  // Cache-first for static shell
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            // Only cache valid same-origin responses
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }

            const toCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, toCache));

            return response;
          })
          .catch(() => {
            // Offline fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

/* ── Background sync placeholder (future) ─────────────────────── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-food-log') {
    // Reserved for future offline food log sync
    console.log('[SW] Background sync: sync-food-log');
  }
});

/* ── Push notifications placeholder (future) ──────────────────── */
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'SweatItOut';
  const options = {
    body:  data.body  || "Time to sweat! 💪",
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    data:  data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});