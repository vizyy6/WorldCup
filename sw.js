// Service Worker — كأس العالم 2026
// استراتيجية: الشبكة أول لهيكل الموقع (يضمن أحدث نسخة دائماً)، والكاش احتياط فقط لو ما فيه نت.
const CACHE = 'wc26-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', e => {
  // فعّل النسخة الجديدة فوراً بدون انتظار
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skip') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;

  // البيانات الحية (الووركر + openfootball): شبكة أول دائماً
  if (url.includes('workers.dev') || url.includes('githubusercontent') || url.includes('jsdelivr')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // هيكل الموقع (HTML/الصفحة): شبكة أول — يجيب أحدث نسخة دائماً، والكاش احتياط لو انقطع النت
  const isPage = e.request.mode === 'navigate' || url.endsWith('/') || url.endsWith('index.html');
  if (isPage) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // باقي الأصول (خطوط، أيقونات): كاش أول للسرعة مع تحديث بالخلفية
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
