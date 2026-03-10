const CACHE_NAME = 'sweatitout-v4';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/config.js'];
const SKIP_HOSTS = ['supabase.co', 'googleapis.com', 'cerebras.ai', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'openfoodfacts.org'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (SKIP_HOSTS.some(h => url.hostname.includes(h))) return;
  if (e.request.method !== 'GET') return;

  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    })));
  }
});