// sw.js — SweatItOut PWA Service Worker
// CRITICAL: All cross-origin requests (Cerebras AI, Supabase, CORS proxies,
// OpenFoodFacts, CDNs) are passed straight to the network — never cached.
// Only same-origin app-shell files are cached for offline support.

const CACHE_NAME = 'sio-shell-v3';
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png'
];

// ── Install: pre-cache app shell ────────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(SHELL_FILES); })
      .catch(function() { /* ignore cache failures */ })
  );
  // Take over immediately — don't wait for old SW clients to close
  self.skipWaiting();
});

// ── Activate: remove old caches ─────────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  // Claim all open clients immediately
  self.clients.claim();
});

// ── Fetch: pass-through strategy ────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var url = event.request.url;
  var origin = self.location.origin;

  // ── ALWAYS pass through to network (no SW interference) for: ────────────
  //   • All cross-origin requests (APIs, CDNs, proxies, fonts)
  //   • POST / PUT / DELETE / PATCH requests (mutations must never be cached)
  //   • Supabase
  //   • Cerebras AI API
  //   • OpenFoodFacts / CORS proxies
  //   • Any chrome-extension or non-http scheme

  if (
    !url.startsWith('http') ||
    !url.startsWith(origin) ||
    event.request.method !== 'GET'
  ) {
    // Passthrough — do NOT call event.respondWith so the browser handles it natively
    return;
  }

  // ── Same-origin GET: network-first, cache fallback ───────────────────────
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        // Cache successful same-origin GET responses
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        // Network failed — serve from cache if available
        return caches.match(event.request);
      })
  );
});