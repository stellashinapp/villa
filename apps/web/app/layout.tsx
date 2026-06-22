import type { Metadata, Viewport } from 'next';
import PwaRegister from '@/components/PwaRegister';
import RouteProgress from '@/components/RouteProgress';
import KeyboardWatcher from '@/components/KeyboardWatcher';
import './globals.css';

export const metadata: Metadata = {
  title: '빌라톡',
  description: '빌라·다세대 공동관리 서비스',
  applicationName: '빌라톡',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '빌라톡',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#2B2BEE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  // 키보드 노출 시 viewport 자체가 줄어들어 fixed bottom 탭바가
  // 자동으로 키보드 위에 정렬됨 (본문에 끼어드는 현상 차단)
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans bg-bg text-t1 min-h-screen">
        <RouteProgress />
        <KeyboardWatcher />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
