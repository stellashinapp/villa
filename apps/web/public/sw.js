// 빌라톡 PWA — minimal service worker
// 목적: install 가능한 PWA 조건 충족 + 정적 자산 가벼운 캐시.
// 동적 데이터(Supabase 호출 등) 는 캐시하지 않음.

const CACHE = 'villatolk-v1';
const STATIC_ASSETS = [
  '/',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase / 외부 API 는 항상 네트워크
  if (url.origin !== self.location.origin) return;
  // Next.js _next/data 는 네트워크 우선
  if (url.pathname.startsWith('/_next/data')) return;
  // 정적 자산만 cache-first
  if (/\.(png|jpg|jpeg|svg|ico|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })),
    );
  }
});
