// sonia-sw-v5
// Strategy: network-first for HTML (always get fresh app), cache-first for assets
const CACHE = 'sonia-v12';
const HTML_FILES = ['/', './','./index.html'];
const STATIC_FILES = ['./sw.js','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately, don't wait for old tabs to close
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_FILES).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  // Delete ALL old caches so stale HTML is never served
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE) { console.log('[SW] Deleting old cache:', k); return caches.delete(k); }
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('anthropic.com') || e.request.url.includes('googleapis.com')) return;

  const url = new URL(e.request.url);
  const isHTML = e.request.headers.get('accept')?.includes('text/html') ||
                 url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');

  if (isHTML) {
    // NETWORK FIRST for HTML — always try to get fresh version
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('./index.html')) // offline fallback
    );
  } else {
    // CACHE FIRST for static assets (icons, sw, manifest)
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
  }
});
