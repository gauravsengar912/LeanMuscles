// ============================================================
// FitAI Service Worker - Offline App Shell Cache
// ============================================================

const CACHE_NAME = 'fitai-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/components.css',
  '/css/animations.css',
  '/js/config.js',
  '/js/supabase.js',
  '/js/state.js',
  '/js/ui.js',
  '/js/particles.js',
  '/js/auth.js',
  '/js/onboarding.js',
  '/js/ai.js',
  '/js/workout.js',
  '/js/diet.js',
  '/js/foodlog.js',
  '/js/profile.js',
  '/js/home.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(e => console.log('Cache failed for some files:', e));
    }).then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin API calls (Supabase, AI)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('cerebras.ai')) return;
  if (url.hostname.includes('openfoodfacts.org')) return;
  if (url.hostname.includes('youtube.com')) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — return cached version
        return caches.match(request).then(cached => {
          if (cached) return cached;
          // For navigation requests, return index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
