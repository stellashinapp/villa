const path = require('path');

// 재배포 트리거 (데모계정 제거·좌측 브랜드 고정 반영, 2026-05-28)
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@villatolk/shared'],
  compress: true, // gzip/br 응답 압축 (Next 기본값이지만 명시)
  // next/image 최적화 (민원·공지 사진 자동 WebP/AVIF 변환 + responsive)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tdgieeupxxalwxikdxji.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7일
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // 정적자산 1년 immutable 캐시 — 페이지 전환 시 JS/CSS 재다운로드 안 함 (큰 효과)
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' }],
      },
      {
        source: '/logo-source.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' }],
      },
    ];
  },
};

module.exports = nextConfig;
