// sonia-sw-v20
const CACHE = 'sonia-v20';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./','./index.html','./sw.js','./manifest.json','./icon-192.png','./icon-512.png']).catch(()=>{})));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE && caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('anthropic.com') || e.request.url.includes('googleapis.com')) return;
  const isHTML = e.request.headers.get('accept')?.includes('text/html') || e.request.url.endsWith('/') || e.request.url.endsWith('.html');
  if(isHTML) {
    e.respondWith(fetch(e.request).then(res => { if(res.ok){const c=res.clone();caches.open(CACHE).then(cc=>cc.put(e.request,c));} return res; }).catch(() => caches.match('./index.html')));
  } else {
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => { if(res&&res.ok){const c=res.clone();caches.open(CACHE).then(cc=>cc.put(e.request,c));} return res; })));
  }
});
