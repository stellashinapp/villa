import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '빌라톡',
    short_name: '빌라톡',
    description: '빌라·다세대 공동관리 서비스 — 관리자·입주민용',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F6FA',
    theme_color: '#3766EE',
    orientation: 'portrait',
    lang: 'ko',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
