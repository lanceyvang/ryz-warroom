const CACHE = 'warroom-v2';
const SHELL = [
  '/', '/app.css', '/app.js', '/vendor/three.module.min.js',
  '/fonts/blackops.woff2', '/fonts/rajdhani-500.woff2', '/fonts/rajdhani-600.woff2', '/fonts/rajdhani-700.woff2',
  '/art/emblem.png', '/art/hero-bg.jpg', '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api')) {
    // network-first for live data, cached fallback for offline review
    e.respondWith(
      fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // cache-first shell
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
