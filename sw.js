// SweatItOut Service Worker
// Only caches static assets — never intercepts API or Supabase requests

var CACHE_NAME = 'sweatitout-v3';

var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Hosts to NEVER cache — pass straight through to network
var SKIP_HOSTS = [
  'supabase.co',
  'googleapis.com',
  'generativelanguage.googleapis.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com'
];

// ── Install: cache static assets ─────────────────────────────────────
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function(err) {
        console.warn('[SW] Pre-cache failed (some assets may not exist yet):', err);
      });
    })
  );
});

// ── Activate: remove old caches ──────────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch: network-first for HTML, cache-first for static, skip APIs ─
self.addEventListener('fetch', function(e) {
  var url;
  try { url = new URL(e.request.url); } catch(err) { return; }

  // 1. Skip non-GET requests entirely
  if (e.request.method !== 'GET') return;

  // 2. Skip all external API hosts — let them go straight to network
  for (var i = 0; i < SKIP_HOSTS.length; i++) {
    if (url.hostname.indexOf(SKIP_HOSTS[i]) !== -1) return;
  }

  // 3. Skip chrome-extension and non-http(s) schemes
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 4. For HTML pages: network-first (always get fresh index.html)
  if (e.request.headers.get('accept') && e.request.headers.get('accept').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, resClone); });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // 5. For other static assets: cache-first, network fallback
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, resClone); });
        return res;
      });
    })
  );
});
