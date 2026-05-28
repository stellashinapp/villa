// 빌라톡 PWA — 페이지 전환 속도 최적화 서비스워커
// 핵심: nginx 가 모든 응답에 'no-cache' 헤더를 강제로 박는 환경에서 SW 로 우회 캐싱.
// - /_next/static/* (JS/CSS 청크, 파일명에 해시 → immutable): cache-first 영구캐시 (큰 효과)
// - /icons, /logo-source.png: cache-first 7일
// - HTML 페이지: stale-while-revalidate (즉시 표시 + 백그라운드 갱신)
// - Supabase 호출 / API: 항상 네트워크

const STATIC_CACHE = 'villatolk-static-v2';   // /_next/static + 아이콘 (immutable)
const PAGE_CACHE   = 'villatolk-pages-v2';    // HTML (SWR)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll([
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/apple-touch-icon.png',
      '/logo-source.png',
    ]).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 다른 origin (Supabase, kakao, 외부 API) 은 SW 가 안 건드림 → 네트워크 직행
  if (url.origin !== self.location.origin) return;
  // RSC payload / Next.js data : 네트워크 우선 (서버 분기 최신화)
  if (url.pathname.startsWith('/_next/data')) return;
  // RSC 요청 (Next 가 헤더로 분기) 도 네트워크
  if (req.headers.get('rsc') || req.headers.get('Next-Router-State-Tree')) return;

  // ① /_next/static/* — 파일명에 해시 박혀 있어 영구 cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      }),
    );
    return;
  }

  // ② 정적 이미지 — cache-first
  if (/\.(png|jpg|jpeg|svg|ico|webp|webmanifest|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      }),
    );
    return;
  }

  // ③ HTML 페이지 — stale-while-revalidate (이전 캐시 즉시 표시 + 백그라운드 갱신)
  // /api 등은 제외
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    if (url.pathname.startsWith('/api/')) return; // API 는 네트워크
    event.respondWith(
      caches.open(PAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networkP = fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || networkP;
      }),
    );
    return;
  }
});
