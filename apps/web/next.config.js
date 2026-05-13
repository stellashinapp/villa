/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@villatolk/shared'],
  // PWA용 — service worker 캐싱 헤더 안전 처리
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
