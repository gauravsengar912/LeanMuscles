const CACHE = 'sweatitout-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.add('/')).catch(()=>{})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if(e.request.method!=='GET') return;
  const url = new URL(e.request.url);
  if(url.hostname.includes('supabase.co')||url.hostname.includes('cerebras.ai')||url.hostname.includes('openfoodfacts.org')) return;
  e.respondWith(fetch(e.request).then(r=>{if(r.status===200){const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}return r;}).catch(()=>caches.match(e.request)||caches.match('/')));
});