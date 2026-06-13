// Service Worker — كأس العالم 2026
// يخزّن هيكل الموقع للفتح السريع وبدون نت، لكن البيانات الحية دايماً من الشبكة أول.
const CACHE = 'wc26-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // البيانات الحية (الووركر + openfootball): شبكة أول، بدون تخزين قديم
  if (url.includes('workers.dev') || url.includes('githubusercontent') || url.includes('jsdelivr')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // هيكل الموقع: كاش أول للسرعة، وتحديث بالخلفية
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
